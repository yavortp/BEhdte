package com.example.driverevents.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalBookingDTO {
     private DriverDTO driver;
     private VehicleDTO vehicle;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DriverDTO {
        private String name;
        private String phoneNumber;
        private String preferredContactMethod;

    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VehicleDTO {
        private String brand;
        private String model;
        private String color;
        private String description;
        private String registration;

    }
}
