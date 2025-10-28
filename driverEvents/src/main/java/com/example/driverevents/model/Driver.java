package com.example.driverevents.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "drivers")
@Data
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @JsonProperty("phone")
    @NotBlank
    private String phoneNumber;

    @Column(length = 64)
    private String token;  // 64-character hex token for API access

    @Column(name = "token_expiry")
    private LocalDateTime tokenExpiry;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = true)
    private Vehicle vehicles;

    @Enumerated(EnumType.STRING)
    private ContactMethod preferredContactMethod = ContactMethod.VOICE;

    @Enumerated(EnumType.STRING)
    private DriverStatus status = DriverStatus.AVAILABLE;

    public enum ContactMethod {
        VOICE,
        SMS,
        WHATSAPP
    }

    public enum DriverStatus {
        AVAILABLE,
        BUSY,
        UNAVAILABLE
    }

}
