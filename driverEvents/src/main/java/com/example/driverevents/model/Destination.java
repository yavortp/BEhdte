package com.example.driverevents.model;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Entity
@Table(name = "destinations")
@Data
public class Destination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private String startLocation;

    @NotNull
    private String endLocation;

    @NotNull
    @Positive
    private Integer durationMinutes;
}
