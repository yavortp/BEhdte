package com.example.driverevents.controller;

import com.example.driverevents.model.Booking;
import com.example.driverevents.service.BookingService;
import com.example.driverevents.service.BookingsSyncService;
import com.example.driverevents.service.FileProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final FileProcessingService fileProcessingService;
    private final BookingsSyncService bookingSyncService;

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

    @PutMapping("/bulk-sync")
    public ResponseEntity<List<Booking>> bulkSync(@RequestBody List<Long> ids) {
        log.info("Starting bulk sync for {} bookings", ids.size());
        List<Booking> syncedBookings = bookingSyncService.syncMultipleBookings(ids);
        log.info("Successfully synced {}/{} bookings", syncedBookings.size(), ids.size());
        return ResponseEntity.ok(syncedBookings);
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
}
