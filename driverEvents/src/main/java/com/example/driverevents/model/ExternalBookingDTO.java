package com.example.driverevents.model;

import java.util.List;

public class ExternalBookingDTO {
     private Driver driver;
     private Vehicle vehicle;

    public Driver getDriver() {
        return driver;
    }

    public void setDriver(Driver driver) {
        this.driver = driver;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public static class Driver {
        private String name;
        private String phoneNumber;
        private String preferredContactMethod;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getPreferredContactMethod() {
            return preferredContactMethod;
        }

        public void setPreferredContactMethod(String preferredContactMethod) {
            this.preferredContactMethod = preferredContactMethod;
        }
    }

    public static class Vehicle {
        private String brand;
        private String model;
        private String color;
        private String description;
        private String registration;

        public String getBrand() {
            return brand;
        }

        public void setBrand(String brand) {
            this.brand = brand;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getRegistration() {
            return registration;
        }

        public void setRegistration(String registration) {
            this.registration = registration;
        }
    }
}
