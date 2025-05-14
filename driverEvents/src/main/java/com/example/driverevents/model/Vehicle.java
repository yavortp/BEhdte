package com.example.driverevents.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Data
public class Vehicle {

    @Id
    @NotBlank
    @Column(unique = true)
    private String id;

    @NotBlank
    private String registrationNumber;

    @NotBlank
    private String brand;

    @NotBlank
    private String model;

    @NotBlank
    private String color;

    private String description;

}
