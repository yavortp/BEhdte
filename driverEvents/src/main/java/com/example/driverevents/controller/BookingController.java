package com.example.driverevents.controller;

import com.example.driverevents.ExternalApiException;
import com.example.driverevents.model.Booking;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.service.BookingService;
import com.example.driverevents.service.BookingsSyncService;
import com.example.driverevents.service.FileProcessingService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
@CrossOrigin(origins = "*")
public class BookingController {
    private final BookingService bookingService;
    private final FileProcessingService fileProcessingService;
    private final BookingsSyncService bookingSyncService;

    public BookingController(
            BookingService bookingService,
            FileProcessingService fileProcessingService,
            BookingsSyncService bookingSyncService
    ) {
        this.bookingService = bookingService;
        this.fileProcessingService = fileProcessingService;
        this.bookingSyncService = bookingSyncService;
    }


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

//    @PutMapping("/{id}/sync")
//    public ResponseEntity<Booking> syncWithApi(@PathVariable Long id) {
//        try {
//            Booking syncedBooking = bookingSyncService.syncSingleBooking(id);
//            return ResponseEntity.ok(syncedBooking);
//        } catch (IllegalArgumentException e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
//        } catch (ExternalApiException e) {
//            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
//        } catch (RuntimeException e) {
//            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
//        }
//    }

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

    @PutMapping("/bulk-sync")
    public ResponseEntity<List<Booking>> bulkSync(@RequestBody List<Long> ids) {
        List<Booking> syncedBookings = bookingSyncService.syncMultipleBookings(ids);
        return ResponseEntity.ok(syncedBookings);
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<?> bulkDelete(@RequestBody List<Long> ids) {
        try {
            bookingService.deleteMultipleBookings(ids);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
