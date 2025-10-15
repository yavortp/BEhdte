package com.example.driverevents.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class TurnstileService {
    @Value("${turnstile.secret-key}")
    private String secretKey;

    private final RestTemplate restTemplate;
    private static final String TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public TurnstileService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean verifyToken(String token, String remoteIp) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("secret", secretKey);
            body.put("response", token);
            if (remoteIp != null) {
                body.put("remoteip", remoteIp);
            }

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                    TURNSTILE_VERIFY_URL,
                    request,
                    JsonNode.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode responseBody = response.getBody();
                boolean success = responseBody.get("success").asBoolean();

                if (!success) {
                    log.warn("Turnstile verification failed: {}", responseBody);
                }

                return success;
            }

            return false;

        } catch (Exception e) {
            log.error("Turnstile verification error: {}", e.getMessage());
            return false;
        }
    }
}
