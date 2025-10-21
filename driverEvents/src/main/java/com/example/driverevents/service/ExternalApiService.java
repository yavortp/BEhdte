package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.ExternalBookingDTO;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.SentLocationsToExternalApiRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalApiService {

    private final SaveSentLocationsToDbService saveSentLocationsToDbService;
    private final SentLocationsToExternalApiRepository sentLocationsToExternalApiRepository;
    private final BookingRepository bookingRepository;
    private final RestTemplate restTemplate;

    @Value("${api.external.base-url}")
    private String externalApiBaseUrl;

    @Value("${api.external.api-key}")
    private String apiKey;

    @Value("${api.external.header-name:Authorization}")
    private String apiKeyHeaderName;

    @Value("${api.external.version:1.0}")
    private String apiVersion;

//    @Value("${api.external.header-prefix:Bearer}")
//    private String apiKeyHeaderPrefix;

    @PostConstruct
    public void init() {
        log.info("=== External API Configuration ===");
        log.info("Base URL: {}", externalApiBaseUrl);
        log.info("API Key configured: {}", apiKey != null && !apiKey.isEmpty());
        log.info("Header name: {}", apiKeyHeaderName);
//        log.info("Header prefix: {}", apiKeyHeaderPrefix);

        if (apiKey == null || apiKey.isEmpty()) {
            log.error("WARNING: External API key is not configured!");
        }
    }

//    Create headers with API key authentication
    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.set("VERSION", apiVersion);

        headers.set(apiKeyHeaderName, apiKey);

        return headers;
    }

    public boolean sendBulkBookingsToApi(String bookingNumber, String vehicleReg, ExternalBookingDTO dto) {

        try {
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<ExternalBookingDTO> request = new HttpEntity<>(dto, headers);

            String url = String.format(
                    "%s/bookings/%s/vehicles/%s",
                    externalApiBaseUrl,
                    bookingNumber,
                    vehicleReg
            );

            log.info("Sending bulk booking to: {}", url);

            ResponseEntity<String> response = new RestTemplate()
                    .exchange(url, HttpMethod.PUT, request, String.class);

            boolean success = response.getStatusCode().is2xxSuccessful();
            if (success) {
                log.info("Successfully sent bulk booking: {} - {}", bookingNumber, vehicleReg);
            } else {
                log.warn("Unexpected status for bulk booking: {}", response.getStatusCode());
            }

            return success;

        } catch (HttpClientErrorException e) {
            log.error("Client error sending bulk booking: {} - Status: {} - Response: {}",
                    bookingNumber, e.getStatusCode(), e.getResponseBodyAsString());

            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.error("⚠️  Authentication failed! Check your API key configuration.");
            }
            return false;

        } catch (Exception e) {
            log.error("Failed to sync bulk bookings for {} - Error: {}", bookingNumber, e.getMessage(), e);
            return false;
        }
    }

    public boolean sendSingleBookingToApi(String bookingNumber, String vehicleReg, ExternalBookingDTO dto) {

        try {
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<ExternalBookingDTO> request = new HttpEntity<>(dto, headers);

            String url = String.format(
                    "%s/bookings/%s/vehicles/%s",
                    externalApiBaseUrl,
                    bookingNumber,
                    vehicleReg
            );
            log.info("Sending single booking to: {}", url);
            log.debug("Headers: VERSION={}, Accept={}, Content-Type={}, Auth={}",
                    headers.get("VERSION"), headers.get("Accept"), headers.getContentType(),
                    apiKeyHeaderName);

            ResponseEntity<String> response = new RestTemplate()
                    .exchange(url, HttpMethod.PUT, request, String.class);

            boolean success = response.getStatusCode().is2xxSuccessful();
            if (success) {
                log.info("Successfully sent single booking: {} - {}", bookingNumber, vehicleReg);
            } else {
                log.warn("Unexpected status for single booking: {}", response.getStatusCode());
            }

            return success;

        } catch (HttpClientErrorException e) {
            log.error("Client error sending single booking: {} - Status: {} - Response: {}",
                    bookingNumber, e.getStatusCode(), e.getResponseBodyAsString());

            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.error("Authentication failed! Check your API key configuration.");
            }
            return false;

        } catch (Exception e) {
            log.error("Failed to sync single booking for {} - Error: {}", bookingNumber, e.getMessage(), e);
            return false;
        }
    }

    public void sendLocationUpdate(Booking booking, LocationUpdateFromDrivers location) {

        saveSentLocationsToDbService.saveLocationUpdate(booking, location);

        try {
            // 1) Build URL like /bookings/HTX-12345678/vehicles/AB-123-XYZ/location
            String url = String.format(
                    "%s/bookings/%s/vehicles/%s/location",
                    externalApiBaseUrl,
                    booking.getBookingNumber(),
                    booking.getVehicle().getRegistrationNumber()
            );

            // 2) Build payload
            Map<String, Object> payload = buildLocationPayload(location);

            log.debug("Sending location update - Booking: {} - Vehicle: {} - Payload: {}",
                    booking.getBookingNumber(),
                    booking.getVehicle().getRegistrationNumber(),
                    payload);

            // 3) Make request
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Location sent successfully - Booking: {} - Vehicle: {}",
                        booking.getBookingNumber(),
                        booking.getVehicle().getRegistrationNumber());

                // Mark as sent in database
                sentLocationsToExternalApiRepository.markAsSent(location.getId());
            } else {
                log.warn("Unexpected status sending location - Booking: {} - Status: {}",
                        booking.getBookingNumber(),
                        response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            log.error("Client error sending location - Booking: {} - Status: {} - Response: {}",
                    booking.getBookingNumber(),
                    e.getStatusCode(),
                    e.getResponseBodyAsString());

            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.error("⚠️  Authentication failed for location update! Check your API key.");
            }

        } catch (Exception e) {
            log.error("Failed to send location update - Booking: {} - Error: {}",
                    booking.getBookingNumber(),
                    e.getMessage(),
                    e);
        }
    }

    private Map<String, Object> buildLocationPayload(LocationUpdateFromDrivers location) {
        Map<String, Object> payload = new HashMap<>();

        // Convert timestamp to ISO-8601 with Sofia timezone offset
        LocalDateTime driverLocal = location.getTimestamp();
        ZoneId sofiaZone = ZoneId.of("Europe/Sofia");
        ZonedDateTime sofiaTime = driverLocal.atZone(sofiaZone);
        OffsetDateTime timestampWithOffset = sofiaTime.toOffsetDateTime();
        String iso8601 = timestampWithOffset.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        payload.put("timestamp", iso8601);

        // Add location coordinates
        Map<String, Object> loc = new HashMap<>();
        loc.put("lat", location.getLatitude());
        loc.put("lng", location.getLongitude());
        payload.put("location", loc);

        return payload;
    }

    public boolean testConnection() {
        try {
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // Try a simple GET request to test auth
            String testUrl = externalApiBaseUrl + "/health"; // Adjust endpoint as needed

            ResponseEntity<String> response = restTemplate.exchange(
                    testUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            boolean success = response.getStatusCode().is2xxSuccessful();
            log.info("External API connection test: {}", success ? "SUCCESS" : "FAILED");
            return success;

        } catch (HttpClientErrorException e) {
            log.error("Connection test failed - Status: {} - Response: {}",
                    e.getStatusCode(),
                    e.getResponseBodyAsString());
            return false;

        } catch (Exception e) {
            log.error("Connection test failed: {}", e.getMessage());
            return false;
        }
    }
}
