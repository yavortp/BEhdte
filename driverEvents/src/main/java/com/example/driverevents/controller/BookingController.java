package com.example.driverevents.controller;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.ExternalBookingDTO;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.service.BookingService;
import com.example.driverevents.service.BookingsSyncService;
import com.example.driverevents.service.ExternalApiService;
import com.example.driverevents.service.FileProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;

@Slf4j
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final FileProcessingService fileProcessingService;
    private final BookingsSyncService bookingSyncService;
    private final BookingRepository bookingRepository;
    private final ExternalApiService externalApiService;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        log.info("Fetching all bookings");
        List<Booking> bookings = bookingService.getAllBookings();
        log.info("Retrieved {} bookings", bookings.size());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBooking(@PathVariable Long id) {
        log.info("Fetching booking with id: {}", id);
        Booking booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody Booking booking) {
        log.info("Creating new booking: {}", booking.getBookingNumber());
        Booking createdBooking = bookingService.createBooking(booking);
        log.info("Successfully created booking with id: {}", createdBooking.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBooking);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(@PathVariable Long id, @Valid @RequestBody Booking booking) {
        log.info("Updating booking with id: {}", id);
        Booking updatedBooking = bookingService.updateBooking(id, booking);
        log.info("Successfully updated booking with id: {}", id);
        return ResponseEntity.ok(updatedBooking);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        log.info("Deleting booking with id: {}", id);
        bookingService.deleteBooking(id);
        log.info("Successfully deleted booking with id: {}", id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/assign-driver/{driverId}")
    public ResponseEntity<Booking> assignDriver(@PathVariable Long id, @PathVariable Long driverId) {
        log.info("Assigning driver {} to booking {}", driverId, id);
        Booking booking = bookingService.assignDriver(id, driverId);
        log.info("Successfully assigned driver {} to booking {}", driverId, id);
        return ResponseEntity.ok(booking);
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        log.info("Processing file upload: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            log.warn("Attempted to upload empty file");
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        try {
            List<Booking> bookings = fileProcessingService.processExcelFile(file);
            log.info("Successfully processed file: {} bookings created/updated", bookings.size());
            return ResponseEntity.ok(Map.of(
                    "message", "File processed successfully",
                    "bookingsCreated", bookings.size()
            ));
        } catch (IOException e) {
            log.error("Failed to process file: {} - Error: {}", file.getOriginalFilename(), e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to process file: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/unsynced")
    public ResponseEntity<List<Booking>> getUnsyncedBookings() {
        log.info("Fetching unsynced bookings");
        List<Booking> bookings = bookingService.getUnsyncedBookings();
        log.info("Found {} unsynced bookings", bookings.size());
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/actions/bulk-sync")
    public ResponseEntity<Map<String, Object>> bulkSync(@RequestBody List<Long> ids) {
        log.info("Starting bulk sync for {} bookings", ids.size());

        try {
            List<Booking> syncedBookings = bookingSyncService.syncMultipleBookings(ids);

            Map<String, Object> response = new HashMap<>();
            response.put("synced", syncedBookings);
            response.put("syncedCount", syncedBookings.size());
            response.put("totalCount", ids.size());
            response.put("failedCount", ids.size() - syncedBookings.size());

            if (syncedBookings.size() < ids.size()) {
                response.put("message", String.format(
                        "Synced %d of %d bookings. Check logs for failures.",
                        syncedBookings.size(), ids.size()
                ));
            } else {
                response.put("message", "All bookings synced successfully");
            }

            log.info("Successfully synced {}/{} bookings", syncedBookings.size(), ids.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Bulk sync failed with exception: {}", e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Bulk sync failed: " + e.getMessage());
            errorResponse.put("syncedCount", 0);
            errorResponse.put("totalCount", ids.size());
            errorResponse.put("failedCount", ids.size());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
//        List<Booking> syncedBookings = bookingSyncService.syncMultipleBookings(ids);
//        log.info("Successfully synced {}/{} bookings", syncedBookings.size(), ids.size());
//
//        Map<String, Object> response = new java.util.HashMap<>();
//        response.put("synced", syncedBookings);
//        response.put("syncedCount", syncedBookings.size());
//        response.put("totalCount", ids.size());
//        response.put("failedCount", ids.size() - syncedBookings.size());
//
//        if (syncedBookings.size() < ids.size()) {
//            response.put("message", String.format("Synced %d of %d bookings. Check logs for failures.",
//                    syncedBookings.size(), ids.size()));
//        } else {
//            response.put("message", "All bookings synced successfully");
//        }
//
//        return ResponseEntity.ok(syncedBookings);
    }

    @PutMapping("/{id}/sync")
    public ResponseEntity<?> syncBookingWithExternalApi(@PathVariable Long id) {
        try {
            log.info("Sync request received for booking ID: {}", id);

            // 1. Get the booking
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

            // 2. Validate that booking has required data
            if (booking.getVehicle() == null || booking.getVehicle().getRegistrationNumber() == null) {
                log.warn("Cannot sync booking {}: No vehicle assigned", id);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Booking must have a vehicle assigned before syncing"));
            }

            if (booking.getDriver() == null) {
                log.warn("Cannot sync booking {}: No driver assigned", id);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Booking must have a driver assigned before syncing"));
            }

            ExternalBookingDTO dto = buildExternalBookingDTO(booking);

            log.info("DTO returned: {}", dto);

            // 4. Call the external API service
            boolean success = externalApiService.sendSingleBookingToApi(
                    booking.getBookingNumber(),
                    booking.getVehicle().getRegistrationNumber(),
                    dto
            );

            // 5. Update sync status if successful
            if (success) {
                booking.setSyncedWithApi(true);
                bookingRepository.save(booking);

                log.info("Successfully synced booking {} with external API", id);
                return ResponseEntity.ok(booking);
            } else {
                log.error("External API returned failure for booking with id: {}, booking number: {}", id, booking.getBookingNumber());
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("error", "Failed to sync with external API - API returned failure"));
            }

        } catch (Exception e) {
            log.error("Error syncing booking {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error syncing booking: " + e.getMessage()));
        }
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<?> bulkDelete(@RequestBody List<Long> ids) {
        log.info("Starting bulk delete for {} bookings", ids.size());
        try {
            bookingService.deleteMultipleBookings(ids);
            log.info("Successfully deleted {} bookings", ids.size());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Failed to delete bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private ExternalBookingDTO buildExternalBookingDTO(Booking booking) {

        log.debug("Building DTO for booking: {}", booking.getBookingNumber());
        log.debug("Driver phone: {}, Contact method: {}" , booking.getDriver().getPhoneNumber(),
                booking.getDriver().getPreferredContactMethod().toString());
                // Build Driver DTO with null-safe defaults

        String contactMethodStr = booking.getDriver().getPreferredContactMethod() != null
                ? booking.getDriver().getPreferredContactMethod().name()
                : "VOICE";

        ExternalBookingDTO.DriverDTO driverDTO = ExternalBookingDTO.DriverDTO.builder()
                .name(booking.getDriver().getName())
                .phoneNumber(booking.getDriver().getPhoneNumber())
                .preferredContactMethod(contactMethodStr)
                .build();

        log.debug("Built DriverDTO - Name: {}, Phone: {}, Contact: {}",
                driverDTO.getName(), driverDTO.getPhoneNumber(), driverDTO.getPreferredContactMethod().toString());

        // Build Vehicle DTO with null-safe defaults
        ExternalBookingDTO.VehicleDTO vehicleDTO = ExternalBookingDTO.VehicleDTO.builder()
                .brand(booking.getVehicle().getBrand())
                .model(booking.getVehicle().getModel())
                .color(booking.getVehicle().getColor())
                .description(booking.getVehicle().getDescription() != null
                        ? booking.getVehicle().getDescription()
                        : "")
                .registration(booking.getVehicle().getRegistrationNumber())
                .build();

        log.debug("Built VehicleDTO - Brand: {}, Model: {}, Registration: {}",
                vehicleDTO.getBrand(), vehicleDTO.getModel(), vehicleDTO.getRegistration());

        // Build complete DTO
        return ExternalBookingDTO.builder()
                .driver(driverDTO)
                .vehicle(vehicleDTO)
                .build();
    }
}
