package com.skillbeacon.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbeacon.ai.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillExtractionService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public List<String> extractSkillsFromDescription(String workDescription) {
        String systemPrompt = "You are a specialized talent intelligence AI. Your task is to extract implicit and explicit professional skills from the user's work description. Return ONLY a JSON array of strings containing the skill names. Do not include markdown code block formatting like ```json. Example: [\"Java\", \"Project Management\", \"SQL\"]";
        String response = geminiClient.generateContent(systemPrompt, "Work Description: " + workDescription);

        try {
            // Remove markdown code blocks if the LLM ignores instructions
            String cleanResponse = response.replaceAll("```json", "").replaceAll("```", "").trim();
            // Parse JSON array string to List<String>
            List<String> rawSkills = objectMapper.readValue(cleanResponse,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            return rawSkills;
        } catch (JsonProcessingException e) {
            log.error("Failed to parse skills JSON from LLM: {}", response, e);
            return new ArrayList<>();
        }
    }
}
