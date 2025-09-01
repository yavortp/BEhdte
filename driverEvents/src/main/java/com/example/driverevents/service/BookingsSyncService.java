package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.ExternalBookingDTO;
import com.example.driverevents.repository.BookingRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BookingsSyncService {

    private final BookingRepository bookingRepository;
    private final ExternalApiService externalApiService;

    public BookingsSyncService(BookingRepository bookingRepository, ExternalApiService externalApiService) {
        this.bookingRepository = bookingRepository;
        this.externalApiService = externalApiService;
    }

    public Booking syncSingleBooking(Long bookingId) {
        Optional<Booking> optional = bookingRepository.findById(bookingId);
        if (optional.isEmpty()) throw new EntityNotFoundException("Booking not found");

        Booking booking = optional.get();
        ExternalBookingDTO dto = mapToExternalDTO(booking);

        boolean success = externalApiService.sendSingleBookingToApi(
                booking.getBookingNumber(),
                booking.getVehicle().getRegistrationNumber(),
                dto
        );

        if (success) {
            booking.setSyncedWithApi(true);
            bookingRepository.save(booking);
        }

        booking.setSyncedWithApi(true);
        System.out.println("Returning booking: " + booking.getId() + ", synced=" + booking.getSyncedWithApi());

        return booking;
    }

    public List<Booking> syncMultipleBookings(List<Long> ids) {
        List<Booking> bookings = bookingRepository.findAllById(ids);
        List<Booking> synced = new ArrayList<>();

        for (Booking booking : bookings) {
            ExternalBookingDTO dto = mapToExternalDTO(booking);
            boolean success = externalApiService.sendSingleBookingToApi(
                    booking.getBookingNumber(),
                    booking.getVehicle().getRegistrationNumber(),
                    dto
            );

            if (success) {
                booking.setSyncedWithApi(true);
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
                synced.add(booking);
            } else {
                System.err.println("Failed to sync booking: " + booking.getBookingNumber());
            }
        }

        return synced;
    }

    private ExternalBookingDTO mapToExternalDTO(Booking booking) {
        ExternalBookingDTO dto = new ExternalBookingDTO();

        ExternalBookingDTO.Driver driver = new ExternalBookingDTO.Driver();
        driver.setName(booking.getDriver().getName());
        driver.setPhoneNumber(booking.getDriver().getPhoneNumber());
        driver.setPreferredContactMethod(booking.getDriver().getPreferredContactMethod().toString());

        ExternalBookingDTO.Vehicle vehicle = new ExternalBookingDTO.Vehicle();
        vehicle.setBrand(booking.getVehicle().getBrand());
        vehicle.setModel(booking.getVehicle().getModel());
        vehicle.setColor(booking.getVehicle().getColor());
        vehicle.setDescription(booking.getVehicle().getDescription());
        vehicle.setRegistration(booking.getVehicle().getRegistrationNumber());

        dto.setDriver(driver);
        dto.setVehicle(vehicle);

        return dto;
    }
}
