package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.DriverRepository;
import com.example.driverevents.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TestDataLoader implements CommandLineRunner {
    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    @Value("${excel.test-data.bookings}")
    private String bookingsFile;

    @Value("${excel.test-data.drivers}")
    private String driversFile;

    @Value("${excel.test-data.vehicles}")
    private String vehiclesFile;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        clearExistingData();

        try {
            loadVehicles();
            loadDrivers();
            loadBookings();

        } catch (Exception e) {
            System.err.println("Error loading test data: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void clearExistingData() {
        try {
            bookingRepository.deleteAll();
            vehicleRepository.deleteAll();
            driverRepository.deleteAll();
        } catch (Exception e) {
            System.err.println("Error clearing existing data: " + e.getMessage());
        }
    }

    @Transactional
    public void loadVehicles() {
        try (FileInputStream fis = new FileInputStream(vehiclesFile);
             Workbook workbook = new XSSFWorkbook(fis)) {

            Sheet sheet = workbook.getSheetAt(0);
            List<Vehicle> vehicles = new ArrayList<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header

                try {
                    Vehicle vehicle = new Vehicle();
                    vehicle.setRegistrationNumber(getStringValue(row.getCell(0)));
                    vehicle.setModel(getStringValue(row.getCell(1)));
                    vehicle.setBrand(getStringValue(row.getCell(2)));
                    vehicle.setColor(getStringValue(row.getCell(3)));
                    vehicle.setCapacity((int) row.getCell(4).getNumericCellValue());
                    vehicle.setStatus(Vehicle.VehicleStatus.valueOf(getStringValue(row.getCell(5))));
                    vehicle.setDescription(getStringValue(row.getCell(7)));

                    // Assign to driver if driver ID is provided
//                    Cell driverIdCell = row.getCell(6);
//                    if (driverIdCell != null) {
//                        Long driverId = (long) driverIdCell.getNumericCellValue();
//                        driverRepository.findById(driverId).ifPresent(vehicle::setDriver);
//                    }

                    vehicles.add(vehicle);
                } catch (Exception e) {
                    System.err.println("Error processing vehicle row " + row.getRowNum() + ": " + e.getMessage());
                }
            }

            vehicleRepository.saveAll(vehicles);
        } catch (Exception e) {
            System.err.println("Error loading vehicles: " + e.getMessage());
            throw new RuntimeException("Failed to load vehicles", e);
        }
    }

    @Transactional
    public void loadDrivers() {
        try (FileInputStream fis = new FileInputStream(driversFile);
             Workbook workbook = new XSSFWorkbook(fis)) {

            Sheet sheet = workbook.getSheetAt(0);
            List<Driver> drivers = new ArrayList<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header

                try {
                    Driver driver = new Driver();
                    driver.setName(getStringValue(row.getCell(0)));
                    driver.setEmail(getStringValue(row.getCell(1)));
                    driver.setPhoneNumber(getStringValue(row.getCell(2)));
                    driver.setPreferredContactMethod(Driver.ContactMethod.valueOf(getStringValue(row.getCell(3))));
                    driver.setStatus(Driver.DriverStatus.valueOf(getStringValue(row.getCell(4))));

                    // Assign vehicle if vehicle number is provided
                    String vehicleNumber = getStringValue(row.getCell(5));
                    if (vehicleNumber != null && !vehicleNumber.isEmpty()) {
                        vehicleRepository.findByRegistrationNumber(vehicleNumber).ifPresent(driver::setVehicles);
                    }

                    drivers.add(driver);
                } catch (Exception e) {
                    System.err.println("Error processing driver row " + row.getRowNum() + ": " + e.getMessage());
                }
            }

            driverRepository.saveAll(drivers);
        } catch (Exception e) {
            System.err.println("Error loading drivers: " + e.getMessage());
            throw new RuntimeException("Failed to load drivers", e);
        }
    }

    @Transactional
    public void loadBookings() {
        try (FileInputStream fis = new FileInputStream(bookingsFile);
             Workbook workbook = new XSSFWorkbook(fis)) {

            Sheet sheet = workbook.getSheetAt(0);
            List<Booking> bookings = new ArrayList<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header

                try {
                    Booking booking = new Booking();
                    booking.setBookingNumber(getStringValue(row.getCell(11)));
                    booking.setStartTime(getDateValue(row.getCell(9)));
                    booking.setStartLocation(getStringValue(row.getCell(6)));
                    booking.setDestination(getStringValue(row.getCell(7)));
                    booking.setNotes(getStringValue(row.getCell(13)));
                    booking.setPRVorShuttle(getStringValue(row.getCell(2)));
                    booking.setArrivalOrDeparture(getStringValue(row.getCell(5)));

                    // Assign driver if driver ID is provided
//                    Cell driverIdCell = row.getCell(8);
//                    if (driverIdCell != null) {
//                        Long driverId = (long) driverIdCell.getNumericCellValue();
//                        driverRepository.findById(driverId).ifPresent(driver ->{
//                            booking.setDriver(driver);
//                            vehicleRepository.findByDriver(driver).ifPresent(booking::setVehicle);
//                        });
//                    }

                    // Assign driver if driver name is provided
                    String driverName = getStringValue(row.getCell(8));
                    if (driverName != null && !driverName.isEmpty()) {
                        driverRepository.findByName(driverName).ifPresent(booking::setDriver);
                    }

                    bookings.add(booking);
                } catch (Exception e) {
                    System.err.println("Error processing booking row " + row.getRowNum() + ": " + e.getMessage());
                }
            }

            for (Booking booking : bookings) {
                try {
                    bookingRepository.save(booking);
                } catch (DataIntegrityViolationException e) {
                    System.err.println("Error saving booking: " + booking.getBookingNumber() + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error loading bookings: " + e.getMessage());
            throw new RuntimeException("Failed to load bookings", e);
        }
    }

    private String getStringValue(Cell cell) {
        if (cell == null) return null;

        try {
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue();
                case NUMERIC:
                    return String.valueOf((long) cell.getNumericCellValue());
                default:
                    return null;
            }
        } catch (Exception e) {
            System.err.println("Error getting string value from cell: " + e.getMessage());
            return null;
        }
    }

    private LocalDateTime getDateValue(Cell cell) {
        if (cell == null) return null;

        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue()
                        .toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime();
            }
        } catch (Exception e) {
            System.err.println("Error getting date value from cell: " + e.getMessage());
        }

        return null;
    }
}