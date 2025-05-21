package com.example.driverevents.controller;

import com.example.driverevents.model.Booking;
import com.example.driverevents.service.BookingService;
import com.example.driverevents.service.FileProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {
    private final BookingService bookingService;
    private final FileProcessingService fileProcessingService;

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

    @PostMapping("/{id}/sync")
    public Booking syncWithApi(@PathVariable Long id) {
        return bookingService.syncWithApi(id);
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
//import com.example.driverevents.model.Booking;
//import com.example.driverevents.service.ExcelBookingService;
//import com.example.driverevents.service.ExternalApiService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.multipart.MultipartFile;
//import java.util.List;
//
//@RestController
//@RequestMapping("api/bookings")
//public class BookingController {
//    @Autowired
//    private ExcelBookingService excelBookingService;
//
//    @Autowired
//    private ExternalApiService externalApiService;
//
//    @PostMapping("/upload")
//    public ResponseEntity<?> uploadBookings(@RequestParam("file") MultipartFile file) {
//        List<Booking> bookings = excelBookingService.parseExcelFile(file);
//
//        for (Booking booking : bookings) {
//            externalApiService.sendBookingToApi(booking); // Each booking as PUT request
//        }
//
//        return ResponseEntity.ok("Bookings uploaded and processed successfully.");
//    }
//
//}
