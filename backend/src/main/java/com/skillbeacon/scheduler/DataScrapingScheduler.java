package com.skillbeacon.scheduler;

import com.skillbeacon.service.ApifyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataScrapingScheduler {

    private final ApifyService apifyService;

    // Run every 10 minutes (600000 ms)
    @Scheduled(fixedRate = 600000)
    public void scheduleScrapingJobs() {
        log.info("Scheduled trigger for scraping jobs...");
        try {
            apifyService.triggerJobScraper();
            apifyService.triggerCourseScraper();
        } catch (Exception e) {
            log.error("Failed to run scheduled scraping jobs", e);
        }
    }
}
