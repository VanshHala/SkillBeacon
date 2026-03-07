package com.skillbeacon.controller;

import com.skillbeacon.model.Course;
import com.skillbeacon.model.Job;
import com.skillbeacon.repository.CourseRepository;
import com.skillbeacon.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataController {

    private final JobRepository jobRepository;
    private final CourseRepository courseRepository;

    @GetMapping("/jobs")
    public Page<Job> getJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search) {

        PageRequest pr = PageRequest.of(page, size);
        boolean hasCity = city != null && !city.trim().isEmpty();
        boolean hasSearch = search != null && !search.trim().isEmpty();

        if (hasCity && hasSearch) {
            return jobRepository.searchByTitleAndCity(search.trim(), city.trim(), pr);
        }
        if (hasCity) {
            return jobRepository.findByLocationCityContainingIgnoreCase(city.trim(), pr);
        }
        if (hasSearch) {
            return jobRepository.searchByTitle(search.trim(), pr);
        }
        return jobRepository.findAll(pr);
    }

    /**
     * Similar jobs — finds jobs in the same normalized category as the search
     * query,
     * excluding exact title matches. Useful for "You might also like" sections.
     */
    @GetMapping("/jobs/similar")
    public Page<Job> getSimilarJobs(
            @RequestParam String search,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {

        // Determine the normalized category from the search term
        String normalized = normalizeSearchToCategory(search.trim());
        PageRequest pr = PageRequest.of(page, size);

        boolean hasCity = city != null && !city.trim().isEmpty();

        if (hasCity) {
            return jobRepository.findSimilarJobsByCategoryAndCity(normalized, search.trim(), city.trim(), pr);
        }
        return jobRepository.findSimilarJobsByCategory(normalized, search.trim(), pr);
    }

    /**
     * Maps a free-form search string to the closest normalized category.
     */
    private String normalizeSearchToCategory(String search) {
        if (search == null)
            return "Software Engineer";
        String lower = search.toLowerCase();
        if (lower.contains("ui") || lower.contains("ux") || lower.contains("design"))
            return "UI/UX Designer";
        if (lower.contains("customer") || lower.contains("support") || lower.contains("bpo"))
            return "Customer Service Executive";
        if (lower.contains("product") && lower.contains("manag"))
            return "Product Manager";
        if (lower.contains("data analyst") || lower.contains("data analysis") || lower.contains("analytics"))
            return "Data Analyst";
        if (lower.contains("ai") || lower.contains("machine learning") || lower.contains("ml engineer"))
            return "AI/ML Engineer";
        if (lower.contains("business analyst"))
            return "Business Analyst";
        if (lower.contains("web dev") || lower.contains("frontend") || lower.contains("front-end"))
            return "Web Developer";
        if (lower.contains("devops") || lower.contains("sre") || lower.contains("infrastructure"))
            return "DevOps Engineer";
        if (lower.contains("digital market") || lower.contains("seo") || lower.contains("content market"))
            return "Digital Marketing Specialist";
        if (lower.contains("data") && (lower.contains("engineer") || lower.contains("scientist")))
            return "Data Analyst";
        if (lower.contains("engineer") || lower.contains("developer") || lower.contains("programmer"))
            return "Software Engineer";
        return "Software Engineer";
    }

    @GetMapping("/courses")
    public Page<Course> getCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String platform) {

        PageRequest pr = PageRequest.of(page, size);
        if (platform != null && !platform.isEmpty()) {
            return courseRepository.findByPlatformIgnoreCase(platform, pr);
        }
        return courseRepository.findAll(pr);
    }

    @GetMapping("/suggestions/cities")
    public List<Map<String, Object>> suggestCities(@RequestParam String q) {
        if (q == null || q.trim().isEmpty())
            return List.of();
        String query = q.trim().toLowerCase();

        List<String> raw = jobRepository.suggestCities(q.trim(), PageRequest.of(0, 20));

        // Rank: exact → starts-with → contains
        List<String> exact = new ArrayList<>();
        List<String> startsWith = new ArrayList<>();
        List<String> contains = new ArrayList<>();

        for (String city : raw) {
            String lower = city.toLowerCase();
            if (lower.equals(query)) {
                exact.add(city);
            } else if (lower.startsWith(query)) {
                startsWith.add(city);
            } else {
                contains.add(city);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        addWithType(results, exact, "exact");
        addWithType(results, startsWith, "startsWith");
        addWithType(results, contains, "similar");

        return results.stream().limit(10).collect(Collectors.toList());
    }

    @GetMapping("/suggestions/titles")
    public List<Map<String, Object>> suggestTitles(@RequestParam String q) {
        if (q == null || q.trim().isEmpty())
            return List.of();
        String query = q.trim().toLowerCase();

        List<String> raw = jobRepository.suggestTitles(q.trim(), PageRequest.of(0, 30));

        // Rank: exact → starts-with → contains
        List<String> exact = new ArrayList<>();
        List<String> startsWith = new ArrayList<>();
        List<String> contains = new ArrayList<>();

        for (String title : raw) {
            String lower = title.toLowerCase();
            if (lower.equals(query)) {
                exact.add(title);
            } else if (lower.startsWith(query)) {
                startsWith.add(title);
            } else {
                contains.add(title);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        addWithType(results, exact, "exact");
        addWithType(results, startsWith, "startsWith");
        addWithType(results, contains, "similar");

        return results.stream().limit(12).collect(Collectors.toList());
    }

    private void addWithType(List<Map<String, Object>> results, List<String> items, String matchType) {
        for (String item : items) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("value", item);
            entry.put("matchType", matchType);
            results.add(entry);
        }
    }
}
