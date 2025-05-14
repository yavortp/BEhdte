package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;

public class BookingService {
    @Autowired
    private BookingRepository bookingRepo;
    @Autowired
    private ExternalApiService externalApiService;

    public Booking saveBookingAndSync(Booking booking) {
        try {
            booking = bookingRepo.save(booking);
            externalApiService.sendBookingToApi(booking);
            booking.setApiSynced(true);
            return bookingRepo.save(booking);
        } catch (Exception e) {
            System.err.println("API sync failed: "+ e.getMessage());
            throw new RuntimeException("Booking saved but API sync failed.");
        }
    }
}
