package com.example.drivereventsbe.service;

import com.example.drivereventsbe.model.Booking;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class ExternalApiService {
    private final RestTemplate restTemplate;

    @Value("${api.external.base-url}")
    private String apiBaseUrl;

    public void sendBookingToApi(Booking booking) {
        String url = apiBaseUrl + "/bookings/" + booking.getBookingNumber();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<Booking> request = new HttpEntity<>(booking, headers);

        restTemplate.exchange(url, HttpMethod.PUT, request, Void.class);
    }
}
