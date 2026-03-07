package com.skillbeacon.service;

import com.skillbeacon.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketIntelligenceService {

    private final JobRepository jobRepository;

    // ═══════════════════════════════════════════════
    // TAB A: HIRING TRENDS
    // ═══════════════════════════════════════════════

    /**
     * Returns hiring volume grouped by city + category for a given period (7, 30,
     * or 90 days), with optional filters.
     */
    public Map<String, Object> getHiringTrends(int days, String category, String city) {
        LocalDate since = LocalDate.now().minusDays(days);

        List<Object[]> byCityCat = jobRepository.countJobsByCityAndCategorySince(since, category, city);
        List<Object[]> byCat = jobRepository.countJobsByCategorySince(since, category, city);
        List<Object[]> byTier = jobRepository.countJobsByCityTierSince(since, category, city);

        // City-Category breakdown
        List<Map<String, Object>> cityCategoryData = byCityCat.stream()
                .map(arr -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("city", arr[0] != null ? arr[0] : "Unknown");
                    m.put("category", arr[1] != null ? arr[1] : "Unknown");
                    m.put("tier", arr[2] != null ? arr[2] : "Unknown");
                    m.put("count", arr[3]);
                    return m;
                })
                .collect(Collectors.toList());

        // Category totals
        List<Map<String, Object>> categoryTotals = byCat.stream()
                .map(arr -> Map.<String, Object>of("category", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                .collect(Collectors.toList());

        // Tier distribution
        List<Map<String, Object>> tierDistribution = byTier.stream()
                .map(arr -> Map.<String, Object>of("tier", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                .collect(Collectors.toList());

        long totalJobs = jobRepository.count();

        return Map.of(
                "period", days + "d",
                "totalJobsInPeriod",
                cityCategoryData.stream().mapToLong(m -> ((Number) m.get("count")).longValue()).sum(),
                "totalJobsAllTime", totalJobs,
                "byCityAndCategory", cityCategoryData,
                "byCategory", categoryTotals,
                "byTier", tierDistribution);
    }

    // ═══════════════════════════════════════════════
    // TAB B: SKILLS INTELLIGENCE
    // ═══════════════════════════════════════════════

    /**
     * Returns the top 20 rising and declining skills by comparing
     * skill frequency in the current 7-day window vs. the previous 7-day window.
     */
    public Map<String, Object> getSkillsIntelligence() {
        LocalDate now = LocalDate.now();
        LocalDate currentStart = now.minusDays(7);
        LocalDate prevStart = now.minusDays(14);

        List<Object[]> currentWindow = jobRepository.getSkillCountsInWindow(currentStart, now);
        List<Object[]> prevWindow = jobRepository.getSkillCountsInWindow(prevStart, currentStart);

        Map<String, Long> currentMap = toSkillMap(currentWindow);
        Map<String, Long> prevMap = toSkillMap(prevWindow);

        // Collect all skills
        Set<String> allSkills = new HashSet<>();
        allSkills.addAll(currentMap.keySet());
        allSkills.addAll(prevMap.keySet());

        // Calculate growth
        List<Map<String, Object>> skillChanges = new ArrayList<>();
        for (String skill : allSkills) {
            long curr = currentMap.getOrDefault(skill, 0L);
            long prev = prevMap.getOrDefault(skill, 0L);

            // Handle situations where previous data might be 0 (like right after a fresh
            // scrape)
            double changeScore;
            if (prev == 0) {
                changeScore = curr > 5 ? 15.0 + (curr * 0.1) : 0.0; // Give a modest positive growth, not huge
            } else {
                changeScore = ((double) (curr - prev) / prev) * 100.0;
                // Cap extreme percentages caused by small numbers
                changeScore = Math.min(changeScore, 250.0);
            }

            skillChanges.add(Map.of(
                    "skill", skill,
                    "currentCount", curr,
                    "previousCount", prev,
                    "changePercent", Math.round(changeScore * 10.0) / 10.0));
        }

        // Sort for rising (desc) and declining (asc)
        List<Map<String, Object>> rising = skillChanges.stream()
                .sorted((a, b) -> Double.compare((Double) b.get("changePercent"), (Double) a.get("changePercent")))
                .limit(20)
                .collect(Collectors.toList());

        List<Map<String, Object>> declining = skillChanges.stream()
                .sorted(Comparator.comparingDouble(a -> (Double) a.get("changePercent")))
                .limit(20)
                .collect(Collectors.toList());

        // Top skills overall (last 30 days)
        List<Object[]> topSkills = jobRepository.getTopSkillsSince(now.minusDays(30), 20);
        List<Map<String, Object>> topSkillsList = topSkills.stream()
                .map(arr -> Map.<String, Object>of("skill", arr[0], "count", arr[1]))
                .collect(Collectors.toList());

        return Map.of(
                "risingSkills", rising,
                "decliningSkills", declining,
                "topSkills30d", topSkillsList);
    }

    // ═══════════════════════════════════════════════
    // TAB C: AI VULNERABILITY INDEX
    // ═══════════════════════════════════════════════

    /**
     * Calculate AI Vulnerability Index (0-100) per normalized job category.
     * Signals: hiring decline, AI tool mentions, role replacement ratio.
     */
    public List<Map<String, Object>> getAIVulnerabilityIndex(String city) {
        // AI tool mention counts per category
        List<Object[]> aiCounts = jobRepository.countJobsWithAIToolsByCategory(city);
        Map<String, Long> aiMap = new HashMap<>();
        for (Object[] arr : aiCounts) {
            if (arr[0] != null)
                aiMap.put(arr[0].toString(), ((Number) arr[1]).longValue());
        }

        // Total jobs per category
        List<Object[]> totalCounts = jobRepository.countTotalJobsByCategory(city);
        Map<String, Long> totalMap = new HashMap<>();
        for (Object[] arr : totalCounts) {
            if (arr[0] != null)
                totalMap.put(arr[0].toString(), ((Number) arr[1]).longValue());
        }

        // Hiring volume: recent 30d vs previous 30d
        LocalDate now = LocalDate.now();
        List<Object[]> recentHiring = jobRepository.countJobsByCategoryInWindow(now.minusDays(30), now, city);
        List<Object[]> olderHiring = jobRepository.countJobsByCategoryInWindow(now.minusDays(60), now.minusDays(30),
                city);
        Map<String, Long> recentMap = toCountMap(recentHiring);
        Map<String, Long> olderMap = toCountMap(olderHiring);

        List<Map<String, Object>> results = new ArrayList<>();
        for (String category : totalMap.keySet()) {
            long total = totalMap.get(category);
            long aiCount = aiMap.getOrDefault(category, 0L);
            long recent = recentMap.getOrDefault(category, 0L);
            long older = olderMap.getOrDefault(category, 0L);

            double aiPenetration = total == 0 ? 0 : ((double) aiCount / total) * 100.0;

            // 1. AI Penetration: High penetration means the job REQUIRES AI, so it is SAFE
            // (lower vulnerability).
            // Conversely, low AI penetration makes it more vulnerable to being automated
            // away.
            double aiRiskWeight = 100.0 - aiPenetration;

            // 2. Hiring Decline: If hiring is dropping, vulnerability is higher.
            double hiringDecline = older == 0 ? 0 : Math.max(0, ((double) (older - recent) / older) * 100.0);

            // Synthetic Role Replacement Ratio
            double roleReplacementRatio = (aiRiskWeight * 0.4) + (hiringDecline * 0.6);

            // Formula for AVI (Risk of losing job to AI)
            double avi = (0.5 * aiRiskWeight) + (0.3 * hiringDecline) + (0.2 * roleReplacementRatio);
            avi = Math.min(100.0, Math.max(0.0, avi));

            // Risk trend calculation
            String trend = (hiringDecline > 10.0 || avi > 65.0) ? "Rising Risk" : "Stable";
            if (recent > older && aiPenetration > 15.0) {
                trend = "Falling Risk";
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("category", category);
            entry.put("totalJobs", total);
            entry.put("jobsWithAITools", aiCount);
            entry.put("signals", Map.of(
                    "aiPenetrationPercent", Math.round(aiPenetration * 10.0) / 10.0,
                    "hiringDeclinePercent", Math.round(hiringDecline * 10.0) / 10.0,
                    "roleReplacementRatio", Math.round(roleReplacementRatio * 10.0) / 10.0));
            entry.put("trend", trend);
            entry.put("vulnerabilityIndex", Math.round(avi * 10.0) / 10.0);
            entry.put("riskLevel", avi > 70 ? "High" : avi >= 40 ? "Medium" : "Low");
            results.add(entry);
        }

        results.sort(
                (a, b) -> Double.compare((Double) b.get("vulnerabilityIndex"), (Double) a.get("vulnerabilityIndex")));
        return results;
    }

    /**
     * Get AVI score for a specific category across all cities.
     */
    public double getAVIForCategory(String category) {
        List<Map<String, Object>> all = getAIVulnerabilityIndex(null);
        return all.stream()
                .filter(m -> category.equalsIgnoreCase(m.get("category").toString()))
                .map(m -> (Double) m.get("vulnerabilityIndex"))
                .findFirst()
                .orElse(50.0);
    }

    // ─── Helpers ───

    private Map<String, Long> toSkillMap(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] arr : rows) {
            if (arr[0] != null)
                map.put(arr[0].toString(), ((Number) arr[1]).longValue());
        }
        return map;
    }

    private Map<String, Long> toCountMap(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] arr : rows) {
            if (arr[0] != null)
                map.put(arr[0].toString(), ((Number) arr[1]).longValue());
        }
        return map;
    }
}
