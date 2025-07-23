package com.example.driverevents.controller;

import com.example.driverevents.model.Booking;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.service.BookingService;
import com.example.driverevents.service.FileProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {
    private final BookingService bookingService;
    private final FileProcessingService fileProcessingService;
    private final BookingRepository bookingRepository;


    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/{id}")
    public Booking getBooking(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    @PostMapping
    public Booking createBooking(@Valid @RequestBody Booking booking) {
        return bookingService.createBooking(booking);
    }

    @PutMapping("/{id}")
    public Booking updateBooking(@PathVariable Long id, @Valid @RequestBody Booking booking) {
        return bookingService.updateBooking(id, booking);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/assign-driver/{driverId}")
    public Booking assignDriver(@PathVariable Long id, @PathVariable Long driverId) {
        return bookingService.assignDriver(id, driverId);
    }

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/{id}/sync")
    public Booking syncWithApi(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getDriver() == null || booking.getDriver().getId() == null) {
            throw new IllegalStateException("Booking must have driver and vehicle assigned");
        }

        // Prepare payload for external API
        Map<String, Object> payload = Map.of(
                "bookingNumber", booking.getBookingNumber(),
                "startTime", booking.getStartTime(),
                "destination", booking.getDestination(),
                "driverId", booking.getDriver().getId()
        );

        // Send to external API
        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://external-api.com/bookings", payload, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            booking.setSyncedWithApi(true);
            booking.setUpdatedAt(LocalDateTime.now());
            return bookingRepository.save(booking);
        } else {
            throw new RuntimeException("Failed to sync with external API");
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            List<Booking> bookings = fileProcessingService.processExcelFile(file);
            return ResponseEntity.ok(Map.of(
                    "message", "File processed successfully",
                    "bookingsCreated", bookings.size()
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to process file: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/unsynced")
    public List<Booking> getUnsyncedBookings() {
        return bookingService.getUnsyncedBookings();
    }
}
