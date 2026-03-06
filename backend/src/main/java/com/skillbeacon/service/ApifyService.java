package com.skillbeacon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Slf4j
public class ApifyService {

    private final WebClient webClient;
    private final String apiToken;

    public ApifyService(WebClient.Builder webClientBuilder,
            @Value("${apify.base-url}") String baseUrl,
            @Value("${apify.api-token}") String apiToken) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.apiToken = apiToken;
    }

    public void triggerJobScraper() {
        if (apiToken == null || apiToken.isEmpty() || apiToken.equals("\"\"")) {
            log.warn("Apify API Token not configured. Skipping job scraping trigger.");
            return;
        }
        log.info("Triggering Apify Job Scraper (Mock implementation)");
        // Trigger logic using webClient here
    }

    public void triggerCourseScraper() {
        if (apiToken == null || apiToken.isEmpty() || apiToken.equals("\"\"")) {
            log.warn("Apify API Token not configured. Skipping course scraping trigger.");
            return;
        }
        log.info("Triggering Apify Course Scraper (Mock implementation)");
        // Trigger logic using webClient here
    }
}
