package com.skillbeacon.controller;

import com.skillbeacon.dto.LiveSyncRequest;
import com.skillbeacon.dto.LiveSyncResponse;
import com.skillbeacon.service.LiveSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
@Slf4j
public class LiveSyncController {

    private final LiveSyncService liveSyncService;

    /**
     * POST /api/v1/market/sync-live
     * Triggers a live LinkedIn scrape via Apify, appends fresh data,
     * and returns fully recalculated Layer 1 + Layer 2 state.
     */
    @PostMapping("/sync-live")
    public ResponseEntity<LiveSyncResponse> syncLive(@RequestBody LiveSyncRequest request) {
        log.info("POST /api/v1/market/sync-live — role={}, city={}",
                request.getJobRole(), request.getCity());

        LiveSyncResponse response = liveSyncService.executeLiveSync(request);

        if ("ERROR".equals(response.getStatus())) {
            return ResponseEntity.internalServerError().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
