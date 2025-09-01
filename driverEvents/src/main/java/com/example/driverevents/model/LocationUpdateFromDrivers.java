package com.example.driverevents.model;

import com.example.driverevents.service.DriverLocationListener;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@EntityListeners(DriverLocationListener.class)
@Table(name = "drivers_locations")
@Data
@NoArgsConstructor
@Getter
@Setter
public class LocationUpdateFromDrivers {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private boolean sentToApi = false;

}
