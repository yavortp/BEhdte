package com.example.driverevents.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "drivers")
@Data
public class Driver {

    @NotBlank
    private String name;

    @NotBlank
    @Id
    @Column(unique = true)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    private ContactMethod preferredContactMethod = ContactMethod.VOICE;

    public enum ContactMethod {
        VOICE,
        SMS,
        WHATSAPP
    }

}
