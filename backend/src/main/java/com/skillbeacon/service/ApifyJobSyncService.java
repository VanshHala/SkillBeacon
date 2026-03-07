package com.skillbeacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbeacon.model.Job;
import com.skillbeacon.repository.JobRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ApifyJobSyncService {

    private final JobRepository jobRepository;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // ─── 10 Apify Dataset URLs with assigned categories ───
    private static final List<String[]> DATASETS = List.of(
            new String[] { "MI6vWVHtqFcdcbca0", "UI/UX Designer" },
            new String[] { "iI6af7MdmgsbPHjAV", "Customer Service Executive" },
            new String[] { "kjVauxnjOLt5vwC2W", "Product Manager" },
            new String[] { "fdpyhDbbe6sBr311l", "Data Analyst" },
            new String[] { "0Ksr1NH7T5MKO8pqL", "Software Engineer" },
            new String[] { "fJwo47RwfSPidueKm", "AI/ML Engineer" },
            new String[] { "aNbfPHS2XR7SgvMJu", "Business Analyst" },
            new String[] { "mLuLuXnTXgdKC58Dn", "Web Developer" },
            new String[] { "Cuy1MShdKhkuZgerD", "DevOps Engineer" },
            new String[] { "IHBvGOgJu7S5gBWoL", "Digital Marketing Specialist" });

    // ─── City Tier Classification ───
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

    // ─── Soft Skills Dictionary ───
    private static final List<String> SOFT_SKILLS = List.of(
            "communication", "leadership", "problem solving", "problem-solving",
            "teamwork", "collaboration", "critical thinking", "time management",
            "adaptability", "creativity", "attention to detail", "analytical thinking",
            "decision making", "decision-making", "negotiation", "presentation",
            "interpersonal", "conflict resolution", "mentoring", "stakeholder management",
            "project management", "strategic thinking", "innovation");

    // ─── AI Tools to detect ───
    private static final List<String> AI_TOOLS = List.of(
            "chatgpt", "gpt-4", "gpt-3", "gpt4", "openai", "genai", "gen ai",
            "generative ai", "llm", "large language model",
            "copilot", "github copilot", "midjourney", "dall-e", "dalle",
            "stable diffusion", "gemini", "claude", "bard", "autogpt", "auto-gpt",
            "langchain", "hugging face", "huggingface",
            "ai agent", "ai agents", "prompt engineering",
            "machine learning", "artificial intelligence");

    public ApifyJobSyncService(JobRepository jobRepository, WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper) {
        this.jobRepository = jobRepository;
        this.webClient = webClientBuilder
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedRate = 7200000)
    public void fetchAndSyncAllDatasets() {
        log.info("Starting multi-dataset Apify sync across {} datasets...", DATASETS.size());
        int totalNew = 0;
        for (String[] ds : DATASETS) {
            String datasetId = ds[0];
            String category = ds[1];
            try {
                int added = fetchDataset(datasetId, category);
                totalNew += added;
                log.info("  [{}] synced: {} new jobs", category, added);
            } catch (Exception e) {
                log.error("  [{}] FAILED: {}", category, e.getMessage());
            }
        }
        log.info("Multi-dataset sync complete. Total new jobs added: {}", totalNew);
    }

    private int fetchDataset(String datasetId, String category) throws Exception {
        String url = "https://api.apify.com/v2/datasets/" + datasetId + "/items?format=json&clean=true";

        String response = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (response == null || response.isEmpty())
            return 0;

        JsonNode jobsArray = objectMapper.readTree(response);
        if (!jobsArray.isArray())
            return 0;

        int newJobsAdded = 0;
        for (JsonNode node : jobsArray) {
            String jobUrl = extractField(node, "url", "jobUrl", "applyUrl");
            if (jobUrl != null && jobRepository.existsByJobUrl(jobUrl))
                continue;

            String title = node.path("title").asText("Unknown Title");
            String companyName = node.path("companyName").asText("Confidential");
            String location = node.path("location").asText("India");
            String description = node.path("description").asText("");
            String salary = node.path("salary").asText("Not Specified");

            // ─── City extraction + tier ───
            String city = extractCity(location);
            String cityTier = classifyCityTier(city);

            // ─── NLP: Skill extraction from JD ───
            List<String> extractedSkills = extractSkillsFromText(description);

            // ─── AI tool detection ───
            List<String> aiTools = detectAITools(description);

            // ─── Date parsing ───
            LocalDate postedDate = parseDate(node);

            String extractedSkillsJson = objectMapper.writeValueAsString(extractedSkills);
            String aiToolsJson = objectMapper.writeValueAsString(aiTools);

            Job job = Job.builder()
                    .jobTitle(truncate(title, 255))
                    .companyName(truncate(companyName, 255))
                    .locationCity(truncate(city, 255))
                    .cityTier(cityTier)
                    .normalizedCategory(category)
                    .skillsRequired(extractedSkillsJson)
                    .extractedSkills(extractedSkillsJson)
                    .aiToolMentions(aiToolsJson)
                    .salary(truncate(salary, 255))
                    .jobDescription(description)
                    .sourcePlatform("LinkedIn (Apify)")
                    .jobUrl(jobUrl)
                    .jobPostedDate(postedDate)
                    .build();

            jobRepository.save(job);
            newJobsAdded++;
        }
        return newJobsAdded;
    }

    // ─── HELPERS ───

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
        // Common patterns: "City, State, Country" or "City, Country" or "City"
        String city = location.split(",")[0].trim();
        // Remove "Greater" prefix sometimes seen
        city = city.replaceAll("(?i)^greater\\s+", "");
        // Handle "Remote" or "India" generics
        if (city.equalsIgnoreCase("india") || city.equalsIgnoreCase("remote")) {
            return city;
        }
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
                found.add(capitalizeSkill(skill));
            }
        }
        for (String skill : SOFT_SKILLS) {
            if (containsWholeWord(lowerText, skill)) {
                found.add(capitalizeSkill(skill));
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
                found.add(capitalizeSkill(tool));
            }
        }
        return new ArrayList<>(found);
    }

    private boolean containsWholeWord(String text, String word) {
        // Use regex word boundary for accuracy
        String escaped = Pattern.quote(word);
        Pattern p = Pattern.compile("\\b" + escaped + "\\b", Pattern.CASE_INSENSITIVE);
        return p.matcher(text).find();
    }

    private String capitalizeSkill(String skill) {
        if (skill == null || skill.isEmpty())
            return skill;
        // Special cases
        Map<String, String> specials = Map.ofEntries(
                Map.entry("sql", "SQL"), Map.entry("html", "HTML"), Map.entry("css", "CSS"),
                Map.entry("aws", "AWS"), Map.entry("gcp", "GCP"), Map.entry("api", "API"),
                Map.entry("rest api", "REST API"), Map.entry("graphql", "GraphQL"),
                Map.entry("ci/cd", "CI/CD"), Map.entry("seo", "SEO"), Map.entry("sem", "SEM"),
                Map.entry("crm", "CRM"), Map.entry("nlp", "NLP"), Map.entry("etl", "ETL"),
                Map.entry("sre", "SRE"), Map.entry("k8s", "K8s"), Map.entry("llm", "LLM"),
                Map.entry("genai", "GenAI"), Map.entry("gen ai", "GenAI"),
                Map.entry("chatgpt", "ChatGPT"), Map.entry("gpt-4", "GPT-4"),
                Map.entry("gpt-3", "GPT-3"), Map.entry("gpt4", "GPT-4"),
                Map.entry("openai", "OpenAI"), Map.entry("dall-e", "DALL-E"),
                Map.entry("dalle", "DALL-E"), Map.entry("autogpt", "AutoGPT"),
                Map.entry("auto-gpt", "AutoGPT"), Map.entry("langchain", "LangChain"),
                Map.entry("hugging face", "Hugging Face"), Map.entry("huggingface", "Hugging Face"),
                Map.entry("node.js", "Node.js"), Map.entry("nodejs", "Node.js"),
                Map.entry("react native", "React Native"),
                Map.entry("scikit-learn", "Scikit-learn"),
                Map.entry("docker", "Docker"), Map.entry("kubernetes", "Kubernetes"),
                Map.entry("terraform", "Terraform"), Map.entry("jenkins", "Jenkins"),
                Map.entry("pytorch", "PyTorch"), Map.entry("tensorflow", "TensorFlow"),
                Map.entry("a/b testing", "A/B Testing"),
                Map.entry("c++", "C++"), Map.entry("c#", "C#"), Map.entry(".net", ".NET"),
                Map.entry("power bi", "Power BI"), Map.entry("adobe xd", "Adobe XD"),
                Map.entry("figma", "Figma"), Map.entry("tableau", "Tableau"),
                Map.entry("r", "R"), Map.entry("go", "Go"), Map.entry("golang", "Go"),
                Map.entry("scala", "Scala"), Map.entry("rust", "Rust"),
                Map.entry("swift", "Swift"), Map.entry("kotlin", "Kotlin"),
                Map.entry("flutter", "Flutter"));
        if (specials.containsKey(skill.toLowerCase()))
            return specials.get(skill.toLowerCase());
        // Generic title case
        return Arrays.stream(skill.split("\\s+"))
                .map(w -> w.substring(0, 1).toUpperCase() + w.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
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
