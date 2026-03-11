package com.skillbeacon.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbeacon.ai.GeminiClient;
import com.skillbeacon.model.Course;
import com.skillbeacon.model.User;
import com.skillbeacon.model.WorkerProfile;
import com.skillbeacon.repository.CourseRepository;
import com.skillbeacon.repository.JobRepository;
import com.skillbeacon.repository.UserRepository;
import com.skillbeacon.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final GeminiClient geminiClient;
    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final JobRepository jobRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    private RiskAnalysisService riskAnalysisService;

    /**
     * Personalized chatbot response with:
     * - User profile context (name, job title, city, experience, skills)
     * - Live job market data (category counts, top cities, trending skills)
     * - Course recommendations from the database
     * - Skill gap analysis
     * - Multilingual support
     */
    public String getChatResponse(String message, String clerkUserId) {
        log.info("Building personalized chat context for user: {}", clerkUserId);

        StringBuilder context = new StringBuilder();

        // ─── Step 1: Load user profile ───
        String userName = "User";
        String userEmail = "";
        String userJobTitle = "";
        String userCity = "";
        int userExperience = 0;
        List<String> userSkills = new ArrayList<>();
        String workDescription = "";

        try {
            Optional<User> userOpt = userRepository.findByClerkUserId(clerkUserId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String displayName = user.getName();
                if (displayName == null || displayName.isEmpty()) {
                    displayName = (user.getFirstName() != null ? user.getFirstName() : "") +
                            (user.getLastName() != null ? " " + user.getLastName() : "");
                    displayName = displayName.trim();
                }
                if (displayName.isEmpty()) {
                    displayName = user.getEmail() != null ? user.getEmail().split("@")[0] : "User";
                }
                userName = displayName;
                userEmail = user.getEmail() != null ? user.getEmail() : "";

                List<WorkerProfile> profiles = workerProfileRepository.findByUserId(user.getId());
                if (!profiles.isEmpty()) {
                    WorkerProfile latestProfile = profiles.get(profiles.size() - 1);
                    userJobTitle = latestProfile.getJobTitle() != null ? latestProfile.getJobTitle() : "";
                    userCity = latestProfile.getCity() != null ? latestProfile.getCity() : "";
                    userExperience = latestProfile.getYearsOfExperience() != null ? latestProfile.getYearsOfExperience()
                            : 0;
                    workDescription = latestProfile.getWorkDescription() != null ? latestProfile.getWorkDescription()
                            : "";

                    try {
                        if (latestProfile.getCurrentSkills() != null) {
                            userSkills = objectMapper.readValue(latestProfile.getCurrentSkills(),
                                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                        }
                    } catch (Exception e) {
                        log.warn("Could not parse user skills: {}", e.getMessage());
                    }

                    // Also add extracted skills
                    try {
                        if (latestProfile.getExtractedSkills() != null) {
                            List<String> extracted = objectMapper.readValue(latestProfile.getExtractedSkills(),
                                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                            for (String s : extracted) {
                                if (!userSkills.contains(s))
                                    userSkills.add(s);
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not load user profile: {}", e.getMessage());
        }

        context.append("=== USER PROFILE ===\n");
        context.append("Name: ").append(userName).append("\n");
        if (!userJobTitle.isEmpty())
            context.append("Current Job Title: ").append(userJobTitle).append("\n");
        if (!userCity.isEmpty())
            context.append("City: ").append(userCity).append("\n");
        if (userExperience > 0)
            context.append("Experience: ").append(userExperience).append(" years\n");
        if (!userSkills.isEmpty())
            context.append("Current Skills: ").append(String.join(", ", userSkills)).append("\n");
        if (!workDescription.isEmpty())
            context.append("Work Description: ").append(workDescription).append("\n");

        // ─── Step 2: Live job market data ───
        context.append("\n=== LIVE JOB MARKET DATA ===\n");
        long totalJobs = jobRepository.count();
        context.append("Total jobs in database: ").append(totalJobs).append("\n");

        List<Object[]> categories = jobRepository.countJobsByCategory();
        context.append("Jobs by category:\n");
        for (Object[] cat : categories) {
            if (cat[0] != null) {
                context.append("  - ").append(cat[0]).append(": ").append(cat[1]).append(" jobs\n");
            }
        }

        List<Object[]> cities = jobRepository.countJobsByCity();
        context.append("Top hiring cities: ");
        int topN = Math.min(10, cities.size());
        for (int i = 0; i < topN; i++) {
            Object[] c = cities.get(i);
            if (c[0] != null)
                context.append(c[0]).append("(").append(c[1]).append(") ");
        }
        context.append("\n");

        // ─── Step 3: Trending skills (last 30 days) ───
        try {
            List<Object[]> topSkills = jobRepository.getTopSkillsSince(LocalDate.now().minusDays(30), 15);
            if (!topSkills.isEmpty()) {
                context.append("\nTop in-demand skills (last 30 days): ");
                context.append(topSkills.stream()
                        .map(arr -> arr[0] + "(" + arr[1] + ")")
                        .collect(Collectors.joining(", ")));
                context.append("\n");
            }
        } catch (Exception ignored) {
        }

        // ─── Step 4: Skill gap analysis ───
        if (!userSkills.isEmpty()) {
            try {
                List<Object[]> marketSkills = jobRepository.getTopSkillsSince(LocalDate.now().minusDays(30), 30);
                Set<String> demandedSkillsLower = marketSkills.stream()
                        .map(arr -> arr[0].toString().toLowerCase())
                        .collect(Collectors.toSet());
                Set<String> userSkillsLower = userSkills.stream()
                        .map(String::toLowerCase)
                        .collect(Collectors.toSet());

                List<String> missingSkills = demandedSkillsLower.stream()
                        .filter(s -> !userSkillsLower.contains(s))
                        .limit(10)
                        .collect(Collectors.toList());

                List<String> matchingSkills = userSkillsLower.stream()
                        .filter(demandedSkillsLower::contains)
                        .collect(Collectors.toList());

                context.append("\n=== SKILL GAP ANALYSIS ===\n");
                context.append("User's skills matching market demand: ").append(String.join(", ", matchingSkills))
                        .append("\n");
                context.append("Skill gaps (in-demand but user doesn't have): ")
                        .append(String.join(", ", missingSkills)).append("\n");
            } catch (Exception ignored) {
            }
        }

        // ─── Step 5: Course recommendations from database ───
        try {
            List<Course> allCourses = courseRepository.findAll();
            if (!allCourses.isEmpty()) {
                context.append("\n=== AVAILABLE COURSES IN DATABASE ===\n");
                int count = 0;
                for (Course c : allCourses) {
                    if (count >= 20)
                        break;
                    context.append("  - ").append(c.getCourseName());
                    context.append(" | Platform: ").append(c.getPlatform());
                    if (c.getInstitution() != null)
                        context.append(" | Institution: ").append(c.getInstitution());
                    if (c.getLevel() != null)
                        context.append(" | Level: ").append(c.getLevel());
                    if (c.getSkillsCovered() != null)
                        context.append(" | Skills: ").append(c.getSkillsCovered());
                    if (c.getCourseUrl() != null)
                        context.append(" | URL: ").append(c.getCourseUrl());
                    context.append("\n");
                    count++;
                }
                context.append("(IMPORTANT: Only suggest courses from THIS list above. Do not invent courses.)\n");
            }
        } catch (Exception ignored) {
        }

        // ─── Step 6: Dynamic Context Injection for Chat queries ───
        // If the user's message mentions a specific city from our database,
        // specifically fetch its stats
        boolean mentionedSpecificCity = false;
        try {
            List<Object[]> allCities = jobRepository.countJobsByCity();
            for (Object[] cityData : allCities) {
                if (cityData[0] != null) {
                    String cityStr = cityData[0].toString();
                    if (message.toLowerCase().contains(cityStr.toLowerCase())) {
                        mentionedSpecificCity = true;
                        long cityJobs = jobRepository.countJobsByCategoryAndCity(
                                riskAnalysisService.normalizeToCategory(userJobTitle), cityStr);
                        long exactTitleJobs = jobRepository.countJobsByTitleAndCity(userJobTitle, cityStr);
                        long totalCityJobs = 0;
                        try {
                            List<Object[]> catInCity = jobRepository.countJobsByCategory(); // Approximation if we don't
                                                                                            // have a direct total
                        } catch (Exception ignored) {
                        }

                        context.append("\n=== DYNAMIC CONTEXT (").append(cityStr).append(") ===\n");
                        context.append("The user is asking about ").append(cityStr).append(".\n");
                        context.append("Jobs matching user's title '").append(userJobTitle).append("' in ")
                                .append(cityStr).append(": ").append(exactTitleJobs).append("\n");
                        context.append("Jobs matching user's category in ").append(cityStr).append(": ")
                                .append(cityJobs).append("\n");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract dynamic city context: {}", e.getMessage());
        }

        // Add user's primary city if they didn't explicitly ask for another city
        if (!mentionedSpecificCity && !userCity.isEmpty() && !userJobTitle.isEmpty()) {
            try {
                long jobsInCity = jobRepository.countJobsByTitleAndCity(userJobTitle, userCity);
                context.append("\nJobs matching user's title '").append(userJobTitle)
                        .append("' in their saved local city (").append(userCity)
                        .append("): ").append(jobsInCity).append("\n");
            } catch (Exception ignored) {
            }
        }

        // ─── Build the system prompt ───
        String systemPrompt = "You are SkillBeacon AI, a professional career mentor and talent intelligence assistant.\n\n"
                +
                "YOUR JOB:\n" +
                "- Guide users about career growth, job market trends, skills required for future jobs, and course recommendations.\n"
                +
                "- Always personalize answers using the user's name, job role, city, and experience.\n" +
                "- If recommending courses, ONLY suggest courses from the AVAILABLE COURSES section. Never invent courses.\n"
                +
                "- Always explain WHY a skill or course is useful.\n" +
                "- Use the LIVE JOB MARKET DATA to answer questions about hiring trends and job counts.\n" +
                "- Use the SKILL GAP ANALYSIS to identify what the user should learn.\n" +
                "- **TONE CONSTRAINT:** Be highly specific, objective, and realistic. Do not blindly praise the user or be overly optimistic. Provide balanced, data-driven answers. If a user's skills are not in demand, inform them professionally instead of praising them.\n"
                +
                "- Format responses with bullet points and sections using markdown.\n" +
                "- **CRITICAL LENGTH CONSTRAINT:** Keep your responses balanced (medium length). Do not give overly long essay-style answers. Avoid overly brief one-line answers. Stick strictly to 1-3 short paragraphs or a few bullet points at most.\n\n"
                +
                "**CRITICAL DATA ACCURACY RULES:**\n" +
                "1. When citing job counts, statistics, or numbers, you MUST use ONLY the exact numbers provided in the CONTEXT section below. NEVER estimate, approximate, round, or invent numbers.\n"
                +
                "2. If the CONTEXT does not contain data to answer a question (e.g., a city or category not listed), say 'Based on our current database, I don't have specific data for that.' instead of guessing.\n"
                +
                "3. Always prefix data-backed claims with 'According to our live database' or 'Our data shows' to make it clear.\n"
                +
                "4. NEVER fabricate job titles, company names, salary figures, or statistics that are not in the CONTEXT.\n\n"
                +
                "MULTILINGUAL RULE: Detect the user's input language and ALWAYS respond in that SAME language. " +
                "If user writes in Hindi, respond in Hindi. If in Gujarati, respond in Gujarati. If in English, respond in English.\n\n"
                +
                "CONTEXT:\n" + context;

        return geminiClient.generateContent(systemPrompt, message);
    }
}
