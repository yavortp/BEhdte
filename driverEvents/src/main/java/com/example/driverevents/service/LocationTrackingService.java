package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.LocationUpdate;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.LocationUpdateRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationTrackingService {

    private final BookingRepository bookingRepository;
    private final LocationUpdateRepository locationUpdateRepository;
    private final ExternalApiService externalApiService;

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
}
