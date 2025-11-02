package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.ExternalBookingDTO;
import com.example.driverevents.repository.BookingRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BookingsSyncService {

    private final BookingRepository bookingRepository;
    private final ExternalApiService externalApiService;
    private static final int MAX_BATCH_SIZE = 100;
    private static final int RETRY_ATTEMPTS = 3;

    public BookingsSyncService(BookingRepository bookingRepository, ExternalApiService externalApiService) {
        this.bookingRepository = bookingRepository;
        this.externalApiService = externalApiService;
    }

    public Booking syncSingleBooking(Long bookingId) {
        Optional<Booking> optional = bookingRepository.findById(bookingId);
        if (optional.isEmpty()) throw new EntityNotFoundException("Booking not found with id: " + bookingId);

        Booking booking = optional.get();

        String validationError = validateBooking(booking);
        if (validationError != null) {
            log.error("Booking {} validation failed: {}", booking.getBookingNumber(), validationError);
            throw new IllegalStateException("Booking validation failed: " + validationError);
        }

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
        } else {
            throw new RuntimeException("Failed to sync booking with external API");
        }

        return booking;
    }

    public List<Booking> syncMultipleBookings(List<Long> ids) {
        log.info("Starting bulk sync for {} booking IDs: {}", ids.size(), ids);

        if (ids.size() > MAX_BATCH_SIZE) {
            log.warn("Batch size {} exceeds maximum {}. Processing first {} bookings.",
                    ids.size(), MAX_BATCH_SIZE, MAX_BATCH_SIZE);
            ids = ids.subList(0, MAX_BATCH_SIZE);
        }

        List<Booking> successfullySynced = new ArrayList<>();
        int skippedCount = 0;
        int failedCount = 0;

        List<Booking> bookings = bookingRepository.findAllById(ids);
        log.info("Found {} bookings to sync", bookings.size());

        List<Long> foundIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());
        List<Long> missingIds = ids.stream()
                .filter(id -> !foundIds.contains(id))
                .collect(Collectors.toList());

        if (!missingIds.isEmpty()) {
            log.warn("Bookings not found: {}", missingIds);
            failedCount += missingIds.size();
        }

        for (Booking booking : bookings) {
            try {
                log.debug("Processing booking ID: {}, Number: {}", booking.getId(), booking.getBookingNumber());

                // Skip if already synced
                if (Boolean.TRUE.equals(booking.getSyncedWithApi())) {
                    log.debug("Booking {} is already synced, skipping", booking.getBookingNumber());
                    skippedCount++;
                    continue;
                }

                // Validate booking
                String validationError = validateBooking(booking);
                if (validationError != null) {
                    log.warn("Skipping booking {}: Validation failed - {}",
                            booking.getBookingNumber(), validationError);
                    failedCount++;
                    continue;
                }

                // Try to sync with retry logic
                boolean success = syncWithRetry(booking);

                if (success) {
                    log.info("Successfully synced booking {}", booking.getBookingNumber());
                    booking.setSyncedWithApi(true);
                    booking.setUpdatedAt(LocalDateTime.now());
                    successfullySynced.add(booking);
                } else {
                    log.error("Failed to sync booking: {}", booking.getBookingNumber());
                    failedCount++;
                }

            } catch (Exception e) {
                log.error("Exception syncing booking {}: {}",
                        booking.getBookingNumber(), e.getMessage(), e);
                failedCount++;
            }
        }

        // Batch save all successfully synced bookings
        if (!successfullySynced.isEmpty()) {
            try {
                bookingRepository.saveAll(successfullySynced);
                log.info("Saved {} successfully synced bookings", successfullySynced.size());
            } catch (Exception e) {
                log.error("Failed to save synced bookings: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to persist sync results", e);
            }
        }

        log.info("Bulk sync complete: {} successful, {} failed, {} skipped",
                successfullySynced.size(), failedCount, skippedCount);

        return successfullySynced;
    }

    private boolean syncWithRetry(Booking booking) {
        ExternalBookingDTO dto = mapToExternalDTO(booking);

        for (int attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
            try {
                boolean success = externalApiService.sendSingleBookingToApi(
                        booking.getBookingNumber(),
                        booking.getVehicle().getRegistrationNumber(),
                        dto
                );

                if (success) {
                    return true;
                }

                if (attempt < RETRY_ATTEMPTS) {
                    log.warn("Sync attempt {} failed for booking {}, retrying...",
                            attempt, booking.getBookingNumber());
                    Thread.sleep(1000 * attempt); // Exponential backoff
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Sync interrupted for booking {}", booking.getBookingNumber());
                return false;
            } catch (Exception e) {
                log.error("Sync attempt {} failed for booking {}: {}",
                        attempt, booking.getBookingNumber(), e.getMessage());
                if (attempt == RETRY_ATTEMPTS) {
                    return false;
                }
            }
        }

        return false;
    }

    private String validateBooking(Booking booking) {
        List<String> errors = new ArrayList<>();

        if (booking.getBookingNumber() == null || booking.getBookingNumber().isEmpty()) {
            errors.add("Missing booking number");
        }

        if (booking.getDriver() == null) {
            errors.add("No driver assigned");
        } else {
            if (booking.getDriver().getName() == null || booking.getDriver().getName().isEmpty()) {
                errors.add("Driver missing name");
            }
            if (booking.getDriver().getPhoneNumber() == null || booking.getDriver().getPhoneNumber().isEmpty()) {
                errors.add("Driver missing phone number");
            }
        }

        if (booking.getVehicle() == null) {
            errors.add("No vehicle assigned");
        } else {
            if (booking.getVehicle().getRegistrationNumber() == null ||
                    booking.getVehicle().getRegistrationNumber().isEmpty()) {
                errors.add("Vehicle missing registration number");
            }
            if (booking.getVehicle().getBrand() == null) {
                errors.add("Vehicle missing brand");
            }
            if (booking.getVehicle().getModel() == null) {
                errors.add("Vehicle missing model");
            }
        }

        return errors.isEmpty() ? null : String.join(", ", errors);
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
