package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.DriverRepository;
import com.example.driverevents.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.print.Book;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private BookingRepository bookingRepository;

    private final DriverRepository driverRepository;

    private final VehicleRepository vehicleRepository;

    private ExternalApiService externalApiService;


    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id).
                orElseThrow(() -> new EntityNotFoundException("Booking with id: " + id + " not found"));
    }

    public Booking getBookingByNumber(String bookingNumber) {
        return bookingRepository.findByBookingNumber(bookingNumber).
                orElseThrow(() -> new EntityNotFoundException("Booking number: "+ bookingNumber + " not found"));
    }

    @Transactional
    public Booking createBooking(Booking booking) {
        booking.setSyncedWithApi(false);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking updateBooking(Long id, Booking bookingDetails) {
        Booking booking = getBookingById(id);
        booking.setStartTime(bookingDetails.getStartTime());
        booking.setStartLocation(bookingDetails.getStartLocation());
        booking.setDestination(bookingDetails.getDestination());
        booking.setNotes(bookingDetails.getNotes());
        booking.setSyncedWithApi(false);
        booking.setDriver(bookingDetails.getDriver());
        booking.setPRVorShuttle(bookingDetails.getPRVorShuttle());
        booking.setArrivalOrDeparture(bookingDetails.getArrivalOrDeparture());
        return bookingRepository.save(booking);
    }

    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }

    @Transactional
    public Booking assignDriver(Long bookingId, Long driverId) {
        Booking booking = getBookingById(bookingId);
        Driver driver = driverRepository.findById(driverId).
                orElseThrow(() -> new EntityNotFoundException("Driver with id: " + driverId + " not found"));

        // Check if driver has vehicle assigned
        if (driver.getVehicles() == null) {
            throw new IllegalStateException("Driver needs to have vehicle assigned in order to be assigned to a booking.");
        }

        // Check if driver is available
        if (driver.getStatus() != Driver.DriverStatus.AVAILABLE) {
            throw new IllegalStateException("Driver is not available for booking assignment");
        }

        booking.setDriver(driver);
        booking.setSyncedWithApi(false);
        driver.setStatus(Driver.DriverStatus.BUSY);
        driverRepository.save(driver);

        return bookingRepository.save(booking);
    }

//    @Transactional
//    public Booking assignVehicle(Long bookingId, Long vehicleId) {
//        Booking booking = getBookingById(bookingId);
//        Vehicle vehicle = vehicleRepository.findById(vehicleId)
//                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + vehicleId));
//
//        if (vehicle.getStatus() != Vehicle.VehicleStatus.AVAILABLE) {
//            throw new IllegalStateException("Vehicle is not available");
//        }
//
//        booking.setVehicle(vehicle);
//        booking.setSyncedWithApi(false);
//        vehicle.setStatus(Vehicle.VehicleStatus.IN_USE);
//        vehicleRepository.save(vehicle);
//
//        return bookingRepository.save(booking);
//    }

    @Transactional
    public Booking syncWithApi(Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getDriver() == null ) {         //|| booking.getVehicle() == null
            throw new IllegalStateException("Booking must have a driver and vehicle assigned before syncing!");
        }

        if (booking.getDriver().getVehicles() == null) {
            throw new IllegalStateException("Driver must have a vehicle assigned before syncing booking");
        }

//        if (booking.getVehicle().getStatus() != Vehicle.VehicleStatus.IN_USE) {
//            throw new IllegalStateException("Vehicle must be IN_USE status to sync");
//        }

        // Check if driver has an available vehicle
//        boolean hasAvailableVehicle = booking.getDriver().getVehicles().stream()
//                .anyMatch(v -> v.getStatus() == Vehicle.VehicleStatus.AVAILABLE);

//        if (!hasAvailableVehicle) {
//            throw new IllegalStateException("Driver must have an available vehicle before syncing");
//        }

        externalApiService.sendBookingToApi(booking);
        booking.setSyncedWithApi(true);
        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsForDateRange(LocalDateTime start, LocalDateTime end) {
        return bookingRepository.findByStartTimeBetween(start, end);
    }

    public List<Booking> getUnsyncedBookings() {
        return bookingRepository.findBySyncedWithApi(false);
    }

//    public Booking saveBookingAndSync(Booking booking) {
//        try {
//            booking = bookingRepository.save(booking);
//            externalApiService.sendBookingToApi(booking);
//            booking.setApiSynced(true);
//            return bookingRepository.save(booking);
//        } catch (Exception e) {
//            System.err.println("API sync failed: "+ e.getMessage());
//            throw new RuntimeException("Booking saved but API sync failed.");
//        }
//    }
}
