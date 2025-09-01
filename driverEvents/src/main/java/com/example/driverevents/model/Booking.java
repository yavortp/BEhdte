package com.example.driverevents.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalTime;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "bookings")
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id", nullable = true)
    private Driver driver;

    private String driverName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = true)
    private Vehicle vehicle;

    private String vehicleNumber;

    @NotNull
    private String bookingDate;

    @NotNull
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    @Column(name = "start_time")
    private LocalTime startTime;

    @NotBlank
    private String startLocation;

    @NotBlank
    private String destination;

    private LocalDateTime finishTime;

    @NotNull
    private String arrivalOrDeparture;          // arrival or departure

    private String notes;

    @NotBlank
    private String PRVorShuttle;                // private or shuttle

    private boolean syncedWithApi;

    private BookingStatus status = BookingStatus.BEFORE_PICKUP;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum BookingStatus {
        BEFORE_PICKUP,
        WAITING_FOR_CUSTOMER,
        AFTER_PICKUP,
        COMPLETED
    }

    public Boolean getSyncedWithApi() {
        return syncedWithApi;
    }

}
