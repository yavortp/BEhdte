package com.example.driverevents;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class WebConfig {
    @Value("${api.external.timeout}")
    private int timeout;

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder.connectTimeout(Duration.ofMillis(timeout)).readTimeout(Duration.ofMillis(timeout)).build();

    }
}