package com.example.driverevents.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "location_updates")
public class LocationUpdateToDb {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double latitude;
    private Double longitude;

    private OffsetDateTime timestamp;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "booking_number")
    private String bookingNumber;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "vehicle_reg_number")
    private String vehicleRegNumber;

    private boolean sentToExternalApi = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getBookingNumber() {
        return bookingNumber;
    }

    public void setBookingNumber(String bookingNumber) {
        this.bookingNumber = bookingNumber;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleRegNumber() {
        return vehicleRegNumber;
    }

    public void setVehicleRegNumber(String vehicleRegNumber) {
        this.vehicleRegNumber = vehicleRegNumber;
    }

    public boolean isSentToExternalApi() {
        return sentToExternalApi;
    }

    public void setSentToExternalApi(boolean sentToExternalApi) {
        this.sentToExternalApi = sentToExternalApi;
    }
}
