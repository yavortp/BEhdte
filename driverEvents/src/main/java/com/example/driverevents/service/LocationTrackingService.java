package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.DriverRepository;
import com.example.driverevents.repository.LocationUpdateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class LocationTrackingService {

    private final SimpMessagingTemplate websocket;
    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;
    private final LocationUpdateRepository locationUpdateRepository;
    private final ExternalApiService externalApiService;

    // cache for active Websocket connections
    private final Map<String, Boolean> activeConnections = new ConcurrentHashMap<>();

    @KafkaListener(topics = "driver-locations", groupId = "location-tracking-group")
    public void handleLocationUpdate(Map<String, Object> locationData) {
        String driverEmail = (String) locationData.get("username");
        Double latitude = (Double) locationData.get("latitude");
        Double longitude = (Double) locationData.get("longitude");
        OffsetDateTime timestampWithOffset = OffsetDateTime.parse((String) locationData.get("timestamp"));
        System.out.println("OFFSET TIME" + timestampWithOffset);
//        LocalDateTime timestamp = LocalDateTime.parse((String) locationData.get("timestamp"));
        LocalDateTime timestamp = timestampWithOffset.toLocalDateTime();

        System.out.println("- location tracking service - Timestamp: " + timestamp);

        Driver driver = driverRepository.findByEmail(driverEmail);
        if (driver == null) {
            System.err.println("No driver found for email: " + driverEmail);
            return;
        }

        Vehicle vehicle = driver.getVehicles();
        if (vehicle == null) {
            System.err.println("No vehicle assigned to driver: " + driverEmail);
            return;
        }

        // find active booking for this driver
        Booking activeBooking = bookingRepository.findActiveBookingForDriver(driver.getId(), timestamp).orElse(null);

        // save location update to db
        LocationUpdateFromDrivers update = new LocationUpdateFromDrivers();
        update.setUsername(driver.getEmail());
        update.setLatitude(latitude);
        update.setLongitude(longitude);
        update.setTimestamp(timestamp);
        update.setSentToApi(false);

        locationUpdateRepository.save(update);

        // send to websocket if connection is active
        if (activeConnections.containsKey(driverEmail)) {
            websocket.convertAndSend("/topic/driver/" + driverEmail, locationData);
        }

        // if there is an active booking send to external API
        if (activeBooking != null) {
            try {
                externalApiService.sendLocationUpdate(activeBooking, update);
                update.setSentToApi(true);
                locationUpdateRepository.save(update);
            } catch (Exception e) {
                System.err.println("Failed to send location update to external API: " + e.getMessage());
            }
        }
    }

    public void registerWebSocketConnection(String driverEmail) {
        activeConnections.put(driverEmail, true);
    }

    public void removeWebSocketConnection(String driverEmail) {
        activeConnections.remove(driverEmail);
    }

}

