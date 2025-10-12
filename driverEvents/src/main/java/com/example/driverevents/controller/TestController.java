package com.example.driverevents.controller;

import com.example.driverevents.service.ExternalApiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {
    private final ExternalApiService externalApiService;

    public TestController(ExternalApiService externalApiService) {
        this.externalApiService = externalApiService;
    }

    @GetMapping("/external-api-connection")
    public ResponseEntity<Map<String, Object>> testExternalApi() {
        boolean connected = externalApiService.testConnection();
        return ResponseEntity.ok(Map.of(
                "connected", connected,
                "message", connected ? "API connection successful" : "API connection failed"
        ));
    }
}
