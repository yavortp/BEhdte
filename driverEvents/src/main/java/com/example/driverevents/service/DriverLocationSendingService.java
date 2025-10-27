package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class  DriverLocationSendingService {

    private final ActiveBookingService activeBookingService;
    private final ExternalApiService externalApiService;

    @Async
    @EventListener
    public void handleDriverLocation(DriverLocationListener.DriverLocationCreatedEvent event) {

        LocationUpdateFromDrivers location = event.location();
        List<Booking> bookings = activeBookingService.getActiveBookingsForDriver(location.getEmail());
        System.out.println("ACTIVE BOOKINGS FOR : " + location.getEmail() + " are : " + bookings);

        for (Booking b : bookings) {
            System.out.println("TIMESTAMP for booking " + b + " is: " + location.getTimestamp());
            externalApiService.sendLocationUpdate(b, location);
        }
        location.setSentToApi(true);

    }
}
