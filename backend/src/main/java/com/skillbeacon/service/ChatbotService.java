package com.skillbeacon.service;

import com.skillbeacon.ai.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final GeminiClient geminiClient;

    public String getChatResponse(String message, String userContext) {
        String systemPrompt = "You are Beacon AI, a helpful career advisor and talent intelligence assistant for SkillBeacon. Your goal is to guide professionals through career transitions, upskilling, and job market trends based in India. Be concise, encouraging, and highly specific. "
                + userContext;

        return geminiClient.generateContent(systemPrompt, message);
    }
}
