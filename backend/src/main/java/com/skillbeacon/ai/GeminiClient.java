package com.skillbeacon.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
@Slf4j
public class GeminiClient {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiClient(WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.model:gemini-1.5-flash}") String model) {
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com/v1beta/models").build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    @CircuitBreaker(name = "geminiService", fallbackMethod = "fallbackGenerateContent")
    public String generateContent(String systemPrompt, String userPrompt) {
        log.info("Calling Gemini API with model {}", model);
        try {
            String combinedPrompt = systemPrompt + "\n\nUser Question:\n" + userPrompt;
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "contents", new Object[] {
                            Map.of("role", "user", "parts", new Object[] { Map.of("text", combinedPrompt) })
                    }));

            String response = webClient.post()
                    .uri("/{model}:generateContent?key={apiKey}", model, apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode textNode = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            return textNode.asText();
        } catch (Exception e) {
            log.error("Failed to generate content from Gemini", e);
            throw new RuntimeException("AI processing failed", e);
        }
    }

    public String fallbackGenerateContent(String systemPrompt, String userPrompt, Throwable t) {
        log.error("Circuit breaker fallback for Gemini API", t);
        return "{\"error\": \"AI service temporarily degraded.\"}";
    }
}
