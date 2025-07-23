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
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

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
        booking.setPRVorShuttle(bookingDetails.getPRVorShuttle());
        booking.setArrivalOrDeparture(bookingDetails.getArrivalOrDeparture());

        String driverName = bookingDetails.getDriverName();
        Driver driver = driverRepository.findByNameIgnoreCase(driverName.trim())
                .orElseThrow(() -> new EntityNotFoundException("Driver with name '" + driverName + "' not found"));
        booking.setDriver(driver);
        booking.setDriverName(driver.getName());
//        if (driverName != null && !driverName.isBlank()) {
//        }

//        Vehicle vehicle = bookingDetails.getVehicle();
//        if (vehicle != null) {
//            booking.setVehicle(vehicle);
//            booking.setVehicleNumber(vehicle.getRegistrationNumber());
//            booking.setVehicleModel(vehicle.getModel());

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

    @Transactional
    public Booking assignDriverByName(Long bookingId, String driverName) {
        Booking booking = getBookingById(bookingId);

        Driver driver = driverRepository.findByNameIgnoreCase(driverName.trim())
                .orElseThrow(() -> new EntityNotFoundException("Driver with name '" + driverName + "' not found"));

        if (driver.getVehicles() == null) {
            throw new IllegalStateException("Driver has no vehicle assigned");
        }

        if (driver.getStatus() != Driver.DriverStatus.AVAILABLE) {
            throw new IllegalStateException("Driver is not available for booking");
        }

        booking.setDriver(driver);
        booking.setDriverName(driver.getName()); // for frontend display
        booking.setSyncedWithApi(false);

        driver.setStatus(Driver.DriverStatus.BUSY);
        driverRepository.save(driver);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking syncWithApi(Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getDriver() == null ) {         //|| booking.getVehicle() == null
            throw new IllegalStateException("Booking must have a driver and vehicle assigned before syncing!");
        }

        if (booking.getDriver().getVehicles() == null) {
            throw new IllegalStateException("Driver must have a vehicle assigned before syncing booking");
        }

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

}
