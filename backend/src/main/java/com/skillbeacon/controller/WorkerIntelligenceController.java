package com.skillbeacon.controller;

import com.skillbeacon.dto.ChatRequest;
import com.skillbeacon.dto.ChatResponse;
import com.skillbeacon.dto.WorkerAnalysisRequest;
import com.skillbeacon.dto.WorkerAnalysisResponse;
import com.skillbeacon.service.ChatbotService;
import com.skillbeacon.service.WorkerAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/worker")
@RequiredArgsConstructor
public class WorkerIntelligenceController {

    private final WorkerAnalysisService workerAnalysisService;
    private final ChatbotService chatbotService;

    @PostMapping("/analyze")
    public ResponseEntity<WorkerAnalysisResponse> analyzeProfile(
            @RequestBody WorkerAnalysisRequest request,
            Authentication authentication) {

        String clerkUserId = authentication.getName(); // Extracted from Clerk JWT
        WorkerAnalysisResponse response = workerAnalysisService.analyzeWorkerProfile(clerkUserId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            Authentication authentication) {

        // In a real scenario, we'd load the user's latest RiskScore context
        String context = "User ID: " + authentication.getName();
        String reply = chatbotService.getChatResponse(request.getMessage(), context);
        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
