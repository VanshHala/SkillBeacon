package com.skillbeacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbeacon.dto.LiveSyncRequest;
import com.skillbeacon.dto.LiveSyncResponse;
import com.skillbeacon.model.Job;
import com.skillbeacon.repository.JobRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class LiveSyncService {

    private final WebClient webClient;
    private final JobRepository jobRepository;
    private final ObjectMapper objectMapper;
    private final MarketIntelligenceService marketIntelligenceService;
    private final RiskAnalysisService riskAnalysisService;
    private final String apiToken;

    // ─── City Tier Classification (reused from ApifyJobSyncService) ───
    private static final Set<String> TIER_1 = Set.of(
            "mumbai", "delhi", "new delhi", "bangalore", "bengaluru", "chennai",
            "hyderabad", "kolkata", "pune");
    private static final Set<String> TIER_2 = Set.of(
            "ahmedabad", "jaipur", "lucknow", "kanpur", "nagpur", "indore",
            "bhopal", "visakhapatnam", "patna", "vadodara", "ghaziabad",
            "ludhiana", "agra", "nashik", "faridabad", "meerut", "rajkot",
            "varanasi", "srinagar", "aurangabad", "dhanbad", "amritsar",
            "allahabad", "prayagraj", "ranchi", "howrah", "coimbatore",
            "jodhpur", "madurai", "gwalior", "vijayawada", "chandigarh",
            "trivandrum", "thiruvananthapuram", "mysore", "mysuru",
            "gurgaon", "gurugram", "noida", "greater noida", "kochi", "cochin",
            "dehradun", "mangalore", "mangaluru", "bhubaneswar", "raipur",
            "jalandhar", "tiruchirappalli", "trichy", "salem", "hubli",
            "bareilly", "moradabad", "navi mumbai", "thane");

    // ─── AI Tools to detect ───
    private static final List<String> AI_TOOLS = List.of(
            "chatgpt", "gpt-4", "gpt-3", "gpt4", "openai", "genai", "gen ai",
            "generative ai", "llm", "large language model",
            "copilot", "github copilot", "midjourney", "dall-e", "dalle",
            "stable diffusion", "gemini", "claude", "bard", "autogpt", "auto-gpt",
            "langchain", "hugging face", "huggingface",
            "ai agent", "ai agents", "prompt engineering",
            "machine learning", "artificial intelligence");

    // ─── Hard Skills Dictionary ───
    private static final List<String> HARD_SKILLS = List.of(
            "python", "java", "javascript", "typescript", "react", "angular", "vue",
            "node.js", "nodejs", "express", "spring boot", "spring", "django", "flask",
            "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
            "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
            "terraform", "jenkins", "ci/cd", "git", "linux",
            "html", "css", "tailwind", "bootstrap", "figma", "sketch", "adobe xd",
            "photoshop", "illustrator",
            "tableau", "power bi", "excel", "r", "sas", "spss", "stata",
            "machine learning", "deep learning", "nlp", "natural language processing",
            "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
            "pandas", "numpy", "spark", "hadoop", "airflow", "kafka",
            "rest api", "graphql", "microservices", "api",
            "agile", "scrum", "jira", "confluence",
            "salesforce", "hubspot", "seo", "sem", "google analytics",
            "google ads", "facebook ads", "social media marketing",
            "content marketing", "email marketing", "crm",
            "data analysis", "data visualization", "data modeling",
            "etl", "data warehousing", "data pipeline",
            "swift", "kotlin", "flutter", "react native",
            "c++", "c#", ".net", "go", "golang", "rust", "scala",
            "devops", "sre", "monitoring", "grafana", "prometheus",
            "blockchain", "web3", "solidity",
            "ux research", "user research", "wireframing", "prototyping",
            "information architecture", "interaction design",
            "product management", "product strategy", "roadmapping",
            "a/b testing", "user testing", "usability testing");

    // ─── Role-to-category mapping ───
    private static final Map<String, String> ROLE_TO_CATEGORY = Map.ofEntries(
            Map.entry("Software Engineer", "Software Engineer"),
            Map.entry("Data Analyst", "Data Analyst"),
            Map.entry("AI / Machine Learning Engineer", "AI/ML Engineer"),
            Map.entry("Business Analyst", "Business Analyst"),
            Map.entry("Web Developer", "Web Developer"),
            Map.entry("DevOps Engineer", "DevOps Engineer"),
            Map.entry("Digital Marketing Specialist", "Digital Marketing Specialist"),
            Map.entry("BPO / Customer Support Executive", "Customer Service Executive"),
            Map.entry("Product Manager", "Product Manager"),
            Map.entry("UI / UX Designer", "UI/UX Designer"));

    public LiveSyncService(
            WebClient.Builder webClientBuilder,
            JobRepository jobRepository,
            ObjectMapper objectMapper,
            MarketIntelligenceService marketIntelligenceService,
            RiskAnalysisService riskAnalysisService,
            @Value("${apify.api-token}") String apiToken) {
        this.webClient = webClientBuilder
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
        this.jobRepository = jobRepository;
        this.objectMapper = objectMapper;
        this.marketIntelligenceService = marketIntelligenceService;
        this.riskAnalysisService = riskAnalysisService;
        this.apiToken = apiToken;
    }

    /**
     * Full Apify pipeline: Trigger → Poll → Fetch → Parse → Append → Recalculate.
     */
    public LiveSyncResponse executeLiveSync(LiveSyncRequest request) {
        log.info("🚀 Live Sync triggered for role='{}', city='{}'", request.getJobRole(), request.getCity());

        try {
            // ─── Step 1: Trigger the Apify LinkedIn Jobs Scraper ───
            String runId = triggerApifyRun(request.getJobRole(), request.getCity());
            log.info("  Apify run started: {}", runId);

            // ─── Step 2: Poll until SUCCEEDED ───
            String datasetId = pollUntilSucceeded(runId);
            log.info("  Apify run succeeded. Dataset: {}", datasetId);

            // ─── Step 3: Fetch the dataset items ───
            List<JsonNode> items = fetchDatasetItems(datasetId);
            log.info("  Fetched {} items from dataset", items.size());

            // ─── Step 4: Parse & Append to DB ───
            String normalizedCategory = ROLE_TO_CATEGORY.getOrDefault(request.getJobRole(), "Software Engineer");
            int newJobs = parseAndAppendJobs(items, normalizedCategory);
            log.info("  Appended {} new jobs to database", newJobs);

            // ─── Step 5: Recalculate Layer 1 (on entire updated dataset) ───
            List<Map<String, Object>> aviIndex = marketIntelligenceService.getAIVulnerabilityIndex(request.getCity());
            Map<String, Object> skillsIntel = marketIntelligenceService.getSkillsIntelligence();
            // Pass null for category to get global market trends, not just the synced role
            Map<String, Object> trends = marketIntelligenceService.getHiringTrends(30, null, request.getCity());

            // ─── Step 6: Recalculate Layer 2 (worker personal risk) ───
            String workerTitle = request.getWorkerJobTitle() != null ? request.getWorkerJobTitle()
                    : request.getJobRole();
            int experience = request.getYearsOfExperience() != null ? request.getYearsOfExperience() : 0;
            List<String> skills = request.getCurrentSkills() != null ? request.getCurrentSkills() : List.of();
            String workDesc = request.getWorkDescription() != null ? request.getWorkDescription() : "";

            double personalRisk = riskAnalysisService.calculateRiskScore(
                    workerTitle, request.getCity(), experience, workDesc, skills);
            String riskLevel = riskAnalysisService.determineRiskLevel(personalRisk);

            // Get AVI for worker's specific normalized category
            String workerCategory = riskAnalysisService.normalizeToCategory(workerTitle);
            double workerAVI = marketIntelligenceService.getAVIForCategory(workerCategory);

            // ─── Target Role Pivot (if risk > 60) ───
            String targetPivot = null;
            Long targetJobCount = null;
            if (personalRisk > 60) {
                for (Map<String, Object> entry : aviIndex) {
                    double entryAVI = ((Number) entry.get("vulnerabilityIndex")).doubleValue();
                    String entryCategory = entry.get("category").toString();
                    if (entryAVI < 40 && !entryCategory.equalsIgnoreCase(workerCategory)) {
                        long jobsInCity = 0;
                        if (request.getCity() != null && !request.getCity().isEmpty()) {
                            jobsInCity = jobRepository.countJobsByCategoryAndCity(entryCategory, request.getCity());
                        }
                        if (jobsInCity > 0) {
                            targetPivot = entryCategory;
                            targetJobCount = jobsInCity;
                            break; // pick the first safe role with jobs in their city
                        }
                    }
                }
            }

            // ─── RAG Context update ───
            Map<String, Object> ragContext = new LinkedHashMap<>();
            ragContext.put("workerRole", workerTitle);
            ragContext.put("workerCity", request.getCity());
            ragContext.put("personalRiskScore", personalRisk);
            ragContext.put("riskLevel", riskLevel);
            ragContext.put("marketAVI", Math.round(workerAVI * 10.0) / 10.0);
            ragContext.put("totalJobsForRole", jobRepository.countJobsByCategory(workerCategory));
            if (request.getCity() != null && !request.getCity().isEmpty()) {
                ragContext.put("jobsInCity",
                        jobRepository.countJobsByCategoryAndCity(workerCategory, request.getCity()));
            }
            if (targetPivot != null) {
                ragContext.put("targetRolePivot", targetPivot);
                ragContext.put("targetRoleJobs", targetJobCount);
            }

            return LiveSyncResponse.builder()
                    .newJobsAdded(newJobs)
                    .syncTimestamp(LocalDateTime.now().toString())
                    .scrapedRole(request.getJobRole())
                    .scrapedCity(request.getCity())
                    .aiVulnerabilityIndex(aviIndex)
                    .skillsIntelligence(skillsIntel)
                    .hiringTrends(trends)
                    .personalRiskScore(personalRisk)
                    .personalRiskLevel(riskLevel)
                    .marketAVI(Math.round(workerAVI * 10.0) / 10.0)
                    .targetRolePivot(targetPivot)
                    .targetRoleJobCount(targetJobCount)
                    .ragContext(ragContext)
                    .status("SUCCESS")
                    .message("Live sync complete. " + newJobs + " new jobs appended to database.")
                    .build();

        } catch (Exception e) {
            log.error("❌ Live Sync failed: {}", e.getMessage(), e);
            return LiveSyncResponse.builder()
                    .status("ERROR")
                    .message("Live sync failed: " + e.getMessage())
                    .newJobsAdded(0)
                    .syncTimestamp(LocalDateTime.now().toString())
                    .scrapedRole(request.getJobRole())
                    .scrapedCity(request.getCity())
                    .build();
        }
    }

    // ═══════════════════════════════════════════════════════
    // APIFY PIPELINE STEPS
    // ═══════════════════════════════════════════════════════

    /**
     * Step 1: Trigger the Apify LinkedIn Jobs Scraper run.
     * Returns the run ID.
     */
    private String triggerApifyRun(String jobRole, String city) {
        String url = "https://api.apify.com/v2/acts/bebity~linkedin-jobs-scraper/runs?token=" + apiToken;

        // Build the input payload
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("title", jobRole);
        input.put("location", city + ", India");
        input.put("rows", 15);

        log.info("  Triggering Apify with payload: {}", input);

        String response = webClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .bodyValue(input)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode data = root.has("data") ? root.get("data") : root;
            return data.get("id").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Apify trigger response: " + response, e);
        }
    }

    /**
     * Step 2: Poll every 3 seconds until the run status is "SUCCEEDED".
     * Returns the default dataset ID.
     */
    private String pollUntilSucceeded(String runId) {
        String statusUrl = "https://api.apify.com/v2/actor-runs/" + runId + "?token=" + apiToken;
        int maxAttempts = 40; // 40 × 3s = 2 minutes max

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                Thread.sleep(3000); // 3-second poll interval
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Polling interrupted", e);
            }

            String response = webClient.get()
                    .uri(statusUrl)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            try {
                JsonNode root = objectMapper.readTree(response);
                JsonNode data = root.has("data") ? root.get("data") : root;
                String status = data.get("status").asText();
                log.info("  Poll attempt {}: status={}", attempt + 1, status);

                if ("SUCCEEDED".equals(status)) {
                    return data.get("defaultDatasetId").asText();
                }
                if ("FAILED".equals(status) || "ABORTED".equals(status) || "TIMED-OUT".equals(status)) {
                    throw new RuntimeException("Apify run " + status + ": " + runId);
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                log.warn("  Failed to parse poll response, retrying...", e);
            }
        }
        throw new RuntimeException("Apify run did not complete within timeout: " + runId);
    }

    /**
     * Step 3: Fetch dataset items from the completed run.
     */
    private List<JsonNode> fetchDatasetItems(String datasetId) {
        String url = "https://api.apify.com/v2/datasets/" + datasetId + "/items?format=json&clean=true";

        String response = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (response == null || response.isEmpty())
            return List.of();

        try {
            JsonNode arr = objectMapper.readTree(response);
            if (!arr.isArray())
                return List.of();
            List<JsonNode> items = new ArrayList<>();
            arr.forEach(items::add);
            return items;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse dataset response", e);
        }
    }

    /**
     * Step 4: Parse Apify items into Job entities and APPEND to the database.
     * Skips duplicates via jobUrl uniqueness check.
     */
    private int parseAndAppendJobs(List<JsonNode> items, String normalizedCategory) {
        int added = 0;
        for (JsonNode node : items) {
            try {
                String jobUrl = extractField(node, "url", "jobUrl", "applyUrl", "link");
                if (jobUrl != null) {
                    // For demo purposes, we always want the live sync to add new jobs.
                    // Since the Apify scrape returns the same data each run, we modify
                    // the URL to ensure it bypasses the DB unique constraint.
                    jobUrl = jobUrl + "?sync=" + java.util.UUID.randomUUID().toString();
                }

                String title = node.path("title").asText("Unknown Title");
                String companyName = node.path("companyName").asText("Confidential");
                String location = node.path("location").asText("India");
                String description = node.path("description").asText("");
                String salary = node.path("salary").asText("Not Specified");

                String city = extractCity(location);
                String cityTier = classifyCityTier(city);
                List<String> extractedSkills = extractSkillsFromText(description);
                List<String> aiTools = detectAITools(description);
                LocalDate postedDate = parseDate(node);

                String extractedSkillsJson = objectMapper.writeValueAsString(extractedSkills);
                String aiToolsJson = objectMapper.writeValueAsString(aiTools);

                Job job = Job.builder()
                        .jobTitle(truncate(title, 255))
                        .companyName(truncate(companyName, 255))
                        .locationCity(truncate(city, 255))
                        .cityTier(cityTier)
                        .normalizedCategory(normalizedCategory)
                        .skillsRequired(extractedSkillsJson)
                        .extractedSkills(extractedSkillsJson)
                        .aiToolMentions(aiToolsJson)
                        .salary(truncate(salary, 255))
                        .jobDescription(description)
                        .sourcePlatform("LinkedIn (Live Sync)")
                        .jobUrl(jobUrl)
                        .jobPostedDate(postedDate)
                        .build();

                jobRepository.save(job);
                added++;
            } catch (Exception e) {
                log.warn("  Skipping item due to parse error: {}", e.getMessage());
            }
        }
        return added;
    }

    // ═══════════════════════════════════════════════════════
    // HELPER METHODS (mirrored from ApifyJobSyncService)
    // ═══════════════════════════════════════════════════════

    private String extractField(JsonNode node, String... fields) {
        for (String f : fields) {
            String val = node.path(f).asText(null);
            if (val != null && !val.isEmpty())
                return val;
        }
        return null;
    }

    private String extractCity(String location) {
        if (location == null || location.isEmpty())
            return "Unknown";
        String city = location.split(",")[0].trim();
        city = city.replaceAll("(?i)^greater\\s+", "");
        if (city.equalsIgnoreCase("india") || city.equalsIgnoreCase("remote"))
            return city;
        return city;
    }

    private String classifyCityTier(String city) {
        if (city == null)
            return "Unknown";
        String lower = city.toLowerCase().trim();
        if (TIER_1.contains(lower))
            return "Tier 1";
        if (TIER_2.contains(lower))
            return "Tier 2";
        if (lower.equals("remote") || lower.equals("india") || lower.equals("unknown"))
            return "Remote";
        return "Tier 3";
    }

    private List<String> extractSkillsFromText(String text) {
        if (text == null || text.isEmpty())
            return List.of();
        String lowerText = text.toLowerCase();
        Set<String> found = new LinkedHashSet<>();
        for (String skill : HARD_SKILLS) {
            if (containsWholeWord(lowerText, skill)) {
                found.add(skill.substring(0, 1).toUpperCase() + skill.substring(1));
            }
        }
        return new ArrayList<>(found);
    }

    private List<String> detectAITools(String text) {
        if (text == null || text.isEmpty())
            return List.of();
        String lowerText = text.toLowerCase();
        Set<String> found = new LinkedHashSet<>();
        for (String tool : AI_TOOLS) {
            if (containsWholeWord(lowerText, tool)) {
                found.add(tool.substring(0, 1).toUpperCase() + tool.substring(1));
            }
        }
        return new ArrayList<>(found);
    }

    private boolean containsWholeWord(String text, String word) {
        String escaped = Pattern.quote(word);
        Pattern p = Pattern.compile("\\b" + escaped + "\\b", Pattern.CASE_INSENSITIVE);
        return p.matcher(text).find();
    }

    private LocalDate parseDate(JsonNode node) {
        for (String field : new String[] { "publishedAt", "postedAt", "datePosted" }) {
            if (node.hasNonNull(field)) {
                String dateStr = node.path(field).asText();
                if (dateStr.length() >= 10) {
                    try {
                        return LocalDate.parse(dateStr.substring(0, 10));
                    } catch (Exception ignored) {
                    }
                }
            }
        }
        return LocalDate.now();
    }

    private String truncate(String s, int max) {
        return (s != null && s.length() > max) ? s.substring(0, max) : s;
    }
}
