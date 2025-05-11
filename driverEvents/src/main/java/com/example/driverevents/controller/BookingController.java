package com.example.driverevents.controller;
import com.example.driverevents.model.Booking;
import com.example.driverevents.service.ExcelBookingService;
import com.example.driverevents.service.ExternalApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("api/bookings")
public class BookingController {
    @Autowired
    private ExcelBookingService excelBookingService;

    @Autowired
    private ExternalApiService externalApiService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadBookings(@RequestParam("file") MultipartFile file) {
        List<Booking> bookings = excelBookingService.parseExcelFile(file);

        for (Booking booking : bookings) {
            externalApiService.sendBookingToApi(booking); // Each booking as PUT request
        }

        return ResponseEntity.ok("Bookings uploaded and processed successfully.");
    }

}
