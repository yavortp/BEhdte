package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.ExternalBookingDTO;
import com.example.driverevents.repository.BookingRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
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

        return booking;
    }

    public List<Booking> syncMultipleBookings(List<Long> ids) {
        log.info("Starting bulk sync for {} booking IDs: {}", ids.size(), ids);
        List<Booking> bookings = bookingRepository.findAllById(ids);
        log.info("Found {} bookings to sync", bookings.size());
        List<Booking> synced = new ArrayList<>();

        for (Booking booking : bookings) {
            log.info("Processing booking ID: {}, Number: {}", booking.getId(), booking.getBookingNumber());

            // Validate booking has required data
            if (booking.getVehicle() == null || booking.getDriver() == null) {
                log.warn("Skipping booking {}: Missing driver or vehicle", booking.getBookingNumber());
                continue;
            }

            ExternalBookingDTO dto = mapToExternalDTO(booking);
            boolean success = externalApiService.sendSingleBookingToApi(
                    booking.getBookingNumber(),
                    booking.getVehicle().getRegistrationNumber(),
                    dto
            );

            if (success) {
                log.info("Successfully synced booking {}, setting syncedWithApi=true", booking.getBookingNumber());
                booking.setSyncedWithApi(true);
                booking.setUpdatedAt(LocalDateTime.now());
                Booking saved = bookingRepository.save(booking);
                log.info("Saved booking {} with syncedWithApi={}", saved.getBookingNumber(), saved.getSyncedWithApi());
                synced.add(booking);
            } else {
                log.error("Failed to sync booking: {}", booking.getBookingNumber());
            }
        }

        log.info("Bulk sync complete: {}/{} bookings synced successfully", synced.size(), bookings.size());
        return synced;
    }

    private ExternalBookingDTO mapToExternalDTO(Booking booking) {

        String contactMethodStr = booking.getDriver().getPreferredContactMethod() != null
                ? booking.getDriver().getPreferredContactMethod().name()
                : "VOICE";

        // Build Driver DTO (note: DriverDTO, not Driver)
        ExternalBookingDTO.DriverDTO driver = ExternalBookingDTO.DriverDTO.builder()
                .name(booking.getDriver().getName())
                .phoneNumber(booking.getDriver().getPhoneNumber())
                .preferredContactMethod(contactMethodStr)
                .build();

        // Build Vehicle DTO (note: VehicleDTO, not Vehicle)
        ExternalBookingDTO.VehicleDTO vehicle = ExternalBookingDTO.VehicleDTO.builder()
                .brand(booking.getVehicle().getBrand())
                .model(booking.getVehicle().getModel())
                .color(booking.getVehicle().getColor())
                .description(booking.getVehicle().getDescription() != null
                        ? booking.getVehicle().getDescription()
                        : "")
                .registration(booking.getVehicle().getRegistrationNumber())
                .build();

        // Build complete DTO
        return ExternalBookingDTO.builder()
                .driver(driver)
                .vehicle(vehicle)
                .build();
    }
}
