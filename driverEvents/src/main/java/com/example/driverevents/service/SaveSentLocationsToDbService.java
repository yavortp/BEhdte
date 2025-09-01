package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import com.example.driverevents.model.LocationUpdateToDb;
import com.example.driverevents.repository.SentLocationsToExternalApiRepository;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;

@Service
public class SaveSentLocationsToDbService {

    private final SentLocationsToExternalApiRepository sentLocationsToExternalApiRepository;

    public SaveSentLocationsToDbService(SentLocationsToExternalApiRepository sentLocationsToExternalApiRepository) {
        this.sentLocationsToExternalApiRepository = sentLocationsToExternalApiRepository;
    }

    public void saveLocationUpdate(Booking booking, LocationUpdateFromDrivers location) {
        LocationUpdateToDb update = new LocationUpdateToDb();
        update.setLatitude(location.getLatitude());
        update.setLongitude(location.getLongitude());
        update.setTimestamp(location.getTimestamp().atOffset(ZoneOffset.UTC));
        update.setBookingId(booking.getId());
        update.setBookingNumber(booking.getBookingNumber());
        update.setVehicleId(booking.getVehicle().getId());
        update.setVehicleRegNumber(booking.getVehicle().getRegistrationNumber());
        update.setSentToExternalApi(true);

        sentLocationsToExternalApiRepository.save(update);
    }
}
