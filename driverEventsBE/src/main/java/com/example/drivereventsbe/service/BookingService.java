package com.example.drivereventsbe.service;

import com.example.drivereventsbe.model.Booking;
import com.example.drivereventsbe.model.Driver;
import com.example.drivereventsbe.model.Vehicle;
import com.example.drivereventsbe.repository.BookingRepository;
import com.example.drivereventsbe.repository.DriverRepository;
import com.example.drivereventsbe.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final ExternalApiService externalApiService;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found with id: " + id));
    }

    public Booking getBookingByNumber(String bookingNumber) {
        return bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found with number: " + bookingNumber));
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
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new EntityNotFoundException("Driver not found with id: " + driverId));

        booking.setDriver(driver);
        booking.setSyncedWithApi(false);
        driver.setStatus(Driver.DriverStatus.BUSY);
        driverRepository.save(driver);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking assignVehicle(Long bookingId, Long vehicleId) {
        Booking booking = getBookingById(bookingId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + vehicleId));

        booking.setVehicle(vehicle);
        booking.setSyncedWithApi(false);
        vehicle.setStatus(Vehicle.VehicleStatus.IN_USE);
        vehicleRepository.save(vehicle);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking syncWithApi(Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getDriver() == null || booking.getVehicle() == null) {
            throw new IllegalStateException("Booking must have both driver and vehicle assigned before syncing");
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