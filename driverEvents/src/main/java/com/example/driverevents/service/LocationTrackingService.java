package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import com.example.driverevents.model.LocationUpdate;
import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.DriverRepository;
import com.example.driverevents.repository.LocationUpdateRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class LocationTrackingService {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SimpMessagingTemplate websocket;
    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;
    private final LocationUpdateRepository locationUpdateRepository;
    private final ExternalApiService externalApiService;

    // cache for active Websocket connections
    private final Map<String, Boolean> activeConnections = new ConcurrentHashMap<>();

    @KafkaListener(topics = "driver-locations", groupId = "location-tracking-group")
    public void handleLocationUpdate(Map<String, Object> locationData) {
        String driverEmail = (String) locationData.get("driverEmail");
        Double latitude = (Double) locationData.get("latitude");
        Double longitude = (Double) locationData.get("longitude");
        LocalDateTime timestamp = LocalDateTime.parse((String) locationData.get("timestamp"));

        Driver driver = driverRepository.findByEmail(driverEmail);              //set error handling here for driver and vehicle!!!
        Vehicle vehicle = driver.getVehicles();
        String vehRegNum = vehicle.getRegistrationNumber();

        // find active booking for this driver
        Booking activeBooking = bookingRepository.findActiveBookingForDriver(driver.getId(), timestamp).orElse(null);

        String bookingNumber = activeBooking != null ? activeBooking.getBookingNumber() : null;

        // save location update
        LocationUpdate update = new LocationUpdate();
        update.setBooking(activeBooking);
        update.setLatitude(latitude);
        update.setLongitude(longitude);
        update.setTimestamp(timestamp);
        update.setSentToExternalApi(false);
        update.setVehicleRegNumber(vehRegNum);
        update.setBookingNumber(bookingNumber);
        locationUpdateRepository.save(update);

        // send to websocket if connection is active
        if (activeConnections.containsKey(driverEmail)) {
            websocket.convertAndSend("/topic/driver/" + driverEmail, locationData);
        }

        // if there is an active booking send to external API
        if (activeBooking != null) {
            kafkaTemplate.send("external-api-updates", Map.of("bookingId", activeBooking.getId(), "locationUpdate", update));
        }
    }

    @Scheduled(fixedRate = 15000)
    @Transactional
    public void processExternalApiUpdates() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> activeBookings = bookingRepository.findBookingsForLocationUpdates(now);

        for (Booking booking : activeBookings) {
            List<LocationUpdate> updates = locationUpdateRepository.findUnsentUpdatesByBooking(booking.getId());

            for (LocationUpdate update : updates) {
                try {
                    externalApiService.sendLocationUpdate(update);
                    update.setSentToExternalApi(true);
                    locationUpdateRepository.save(update);
                } catch (Exception e) {
                    System.err.println("Failed to send location update: "+ e.getMessage());
                }
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

//    @Transactional
//    public void processLocationUpdate(String driverName, Double latitude, Double longitude, LocalDateTime timestamp, String bookingStatus) {
//        // Find active bookings for the driver
//        List<Booking> activeBookings = bookingRepository.findActiveBookinsByDriverName(driverName);
//
//        for (Booking booking : activeBookings) {
//            LocationUpdate update = new LocationUpdate();
//            update.setBooking(booking);
//            update.setLatitude(latitude);
//            update.setLongitude(longitude);
//            update.setTimestamp(timestamp);
//            update.setSentToApi(false);
//
//            locationUpdateRepository.save(update);
//
//            if (booking.getStatus() == Booking.BookingStatus.BEFORE_PICKUP) {
//                booking.setStatus(Booking.BookingStatus.AFTER_PICKUP);
//                bookingRepository.save(booking);
//            }
//
//        }
//    }
//
//    @Scheduled(fixedRate = 30000)
//    @Transactional
//    public void syncLocationUpdates() {
//        List<LocationUpdate> pendingUpdates = locationUpdateRepository.findBySentToApiFalse();
//
//        for (LocationUpdate update: pendingUpdates) {
//            try {
//                externalApiService.sendLocationUpdate(update);
//                update.setSentToApi(true);
//                locationUpdateRepository.save(update);
//            } catch (Exception e) {
//                // Log error but continue with other updates
//                System.err.println("Failed to sync location update: " + e.getMessage());
//            }
//        }
//    }
//
//    @Scheduled(fixedRate = 60000)
//    @Transactional
//    public void checkBookingCompletions() {
//        List<Booking> inProgressBookings = bookingRepository.findByStatus(Booking.BookingStatus.AFTER_PICKUP);
//        for (Booking booking : inProgressBookings) {
//            //Get latest location
//            LocationUpdate latestLocation = locationUpdateRepository.findFirstByBookingOrderByTimestampDesc(booking).orElse(null);
//
//            if (latestLocation != null) {
//
//            }
//        }
//    }

