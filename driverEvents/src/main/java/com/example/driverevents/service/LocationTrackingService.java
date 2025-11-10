package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.DriverRepository;
import com.example.driverevents.repository.LocationUpdateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationTrackingService {

    private final SimpMessagingTemplate websocket;
    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;
    private final LocationUpdateRepository locationUpdateRepository;
    private final ExternalApiService externalApiService;

    private final Map<String, Boolean> activeConnections = new ConcurrentHashMap<>();

    @Scheduled(fixedRate = 5000) // Every 5 seconds
    @Transactional
    public void pollNewLocations() {
        try {
            // Find all locations that haven't been processed yet (sent_to_api is NULL)
            List<LocationUpdateFromDrivers> newLocations = locationUpdateRepository
                    .findBySentToApiIsNullOrderByTimestampAsc();

            if (!newLocations.isEmpty()) {
                log.debug("Found {} new location updates to process", newLocations.size());

                for (LocationUpdateFromDrivers location : newLocations) {
                    try {
                        handleLocationUpdate(location);
                    } catch (Exception e) {
                        log.error("Error processing location update {}: {}",
                                location.getId(), e.getMessage(), e);
                        // Mark as processed (false) even on error to avoid infinite retries
                        location.setSentToApi(false);
                        locationUpdateRepository.save(location);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error polling for new locations: {}", e.getMessage(), e);
        }
    }

    public void handleLocationUpdate(LocationUpdateFromDrivers location) {
        String driverEmail = location.getEmail();
        Double latitude = location.getLatitude();
        Double longitude = location.getLongitude();
        LocalDateTime timestamp = location.getTimestamp();

//        log.debug("Processing location - Driver: {}, Lat: {}, Lon: {}, Time: {}",
//                driverEmail, latitude, longitude, timestamp);

        Driver driver = driverRepository.findByEmail(driverEmail);
        if (driver == null) {
            log.warn("No driver found for email: {}", driverEmail);
            location.setSentToApi(true);
            locationUpdateRepository.save(location);
            return;
        }

        // find active booking for this driver
        Booking activeBooking = bookingRepository.findActiveBookingForDriver(driver.getId(), timestamp).orElse(null);

        sendToWebSocket(driverEmail, latitude, longitude, timestamp);

        // If there is an active booking, send to external API
        if (activeBooking != null) {
            try {
                log.info("Active booking found: {}. Sending location to external API",
                        activeBooking.getBookingNumber());
                externalApiService.sendLocationUpdate(activeBooking, location);
                location.setSentToApi(true);
            } catch (Exception e) {
                log.error("Failed to send location update to external API for booking {}: {}",
                        activeBooking.getBookingNumber(), e.getMessage(), e);
                // Don't mark as sent if it failed
                location.setSentToApi(false);
            }
        } else {
            log.debug("No active booking found for driver: {}", driverEmail);
            location.setSentToApi(true);
        }

        locationUpdateRepository.save(location);
        log.debug("Location update {} marked as processed", location.getId());
    }

    private void sendToWebSocket(String driverEmail, Double latitude, Double longitude, LocalDateTime timestamp) {
//        log.info("🔔 ATTEMPTING to send location to WebSocket for driver: {}", driverEmail);
        try {
            Map<String, Object> locationData = new HashMap<>();
            locationData.put("email", driverEmail);
            locationData.put("latitude", latitude);
            locationData.put("longitude", longitude);
            locationData.put("timestamp", timestamp.toString());

            String topic = "/topic/location";

            log.info("📤 About to call websocket.convertAndSend - Topic: {}, Data: {}", topic, locationData);
            websocket.convertAndSend(topic, locationData);
            log.info("✅ SUCCESSFULLY sent location to WebSocket topic: {} - Driver: {}", topic, driverEmail);

        } catch (Exception e) {
            log.error("Failed to send location to WebSocket for driver {}: {}",
                    driverEmail, e.getMessage(), e);
            e.printStackTrace();
        }
    }

    public void registerWebSocketConnection(String driverEmail) {
        activeConnections.put(driverEmail, true);
        log.info("WebSocket connection registered for driver: {}", driverEmail);
    }

    public void removeWebSocketConnection(String driverEmail) {
        activeConnections.remove(driverEmail);
        log.info("WebSocket connection removed for driver: {}", driverEmail);
    }
}

