package com.example.driverevents.model;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class BookingWindow {

    private Booking booking;
    private LocalDateTime activeFrom;
    private LocalDateTime activeUntil;
}
