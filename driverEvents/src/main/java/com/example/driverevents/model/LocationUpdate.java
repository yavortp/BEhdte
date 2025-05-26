package com.example.driverevents.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "location_upates")
@Data
public class LocationUpdate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "booking_number")
    private Booking booking;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    private LocalDateTime timestamp;

//    private boolean sentToApi;
}
