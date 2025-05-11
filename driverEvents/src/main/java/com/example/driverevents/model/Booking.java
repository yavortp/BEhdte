package com.example.driverevents.model;

import lombok.Data;
import java.time.LocalDateTime;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "bookings")
@Data
public class Booking {

    @Id
    @NotBlank
    @Column(unique = true)
    private String bookingNumber;

    @ManyToOne
    @NotNull
    private Driver driver;

    @ManyToOne
    @NotNull
    private Vehicle vehicle;

    @NotNull
    private LocalDateTime startTime;

    @NotBlank
    private String startLocation;

    @NotBlank
    private String destination;

    @NotNull
    private String arrivalOrDeparture;          // "arrival" or "departure"

    private String notes;

    @NotBlank
    private String PRVorShuttle;                // private or shuttle

    private boolean apiSynced = false;
}
