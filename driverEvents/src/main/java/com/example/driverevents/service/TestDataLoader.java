package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Destination;
import com.example.driverevents.model.Driver;
import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.DestinationsRepository;
import com.example.driverevents.repository.DriverRepository;
import com.example.driverevents.repository.VehicleRepository;
import jakarta.validation.constraints.NotNull;
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

@Component
@RequiredArgsConstructor
public class TestDataLoader implements CommandLineRunner {
    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final DestinationsRepository destinationsRepository;

    @Value("${excel.test-data.bookings}")
    private String bookingsFile;

    @Value("${excel.test-data.drivers}")
    private String driversFile;

    @Value("${excel.test-data.vehicles}")
    private String vehiclesFile;

    @Value("${excel.test-data.destinations}")
    private String destinationsFile;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (driverRepository.count() == 0) {
            driverRepository.deleteAll();
            loadDrivers();
        }

        if (vehicleRepository.count() == 0) {
            vehicleRepository.deleteAll();
            loadVehicles();
        }

        if (bookingRepository.count() == 0) {
            bookingRepository.deleteAll();
            loadBookings();
        }

//        if (destinationsRepository.count() == 0) {
//            destinationsRepository.deleteAll();
//            loadDestinations();
//        }
//        clearExistingData();

//        try {
//            loadVehicles();
//            loadDrivers();
//            loadDestinations();
//            loadBookings();
//
//        } catch (Exception e) {
//            System.err.println("Error loading test data: " + e.getMessage());
//            e.printStackTrace();
//        }
    }

    @Transactional
    public void clearExistingData() {
        try {
            driverRepository.deleteAll();
            vehicleRepository.deleteAll();
            bookingRepository.deleteAll();
        } catch (Exception e) {
            System.err.println("Error clearing existing data: " + e.getMessage());
        }
    }

    @Transactional
    public void loadDestinations() {
        try (FileInputStream fis = new FileInputStream(destinationsFile);
            Workbook workbook = new XSSFWorkbook(fis)) {

            Sheet sheet = workbook.getSheetAt(0);
            List<Destination> destinations = new ArrayList<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue;

                try {
                    Destination destination = new Destination();
                    destination.setStartLocation(getStringValue(row.getCell(0)));
                    destination.setEndLocation(getStringValue(row.getCell(1)));
                    destination.setDurationMinutes((int) row.getCell(2).getNumericCellValue());

                    destinations.add(destination);
                } catch (Exception e) {
                    System.err.println("Error loading destination " + row.getRowNum() + ": " + e.getMessage());
                }
            }
            destinationsRepository.saveAll(destinations);
        } catch (Exception e) {
            System.err.println("Error loading destinations: " + e.getMessage());
            throw new RuntimeException("Failed to load destinations", e);
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
                    String regNumber = getStringValue(row.getCell(0));
                    // Check for existing vehicle
                    boolean exists = vehicleRepository.existsByRegistrationNumber(regNumber);
                    if (exists) {
                        System.out.println("Skipping duplicate vehicle: " + regNumber);
                        continue;
                    }
                    Vehicle vehicle = new Vehicle();
                    vehicle.setRegistrationNumber(getStringValue(row.getCell(0)));
                    vehicle.setModel(getStringValue(row.getCell(1)));
                    vehicle.setBrand(getStringValue(row.getCell(2)));
                    vehicle.setColor(getStringValue(row.getCell(3)));
                    vehicle.setCapacity((int) row.getCell(4).getNumericCellValue());
                    vehicle.setStatus(Vehicle.VehicleStatus.valueOf(getStringValue(row.getCell(5))));
                    vehicle.setDescription(getStringValue(row.getCell(7)));

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
                        vehicleRepository.findByRegistrationNumber(vehicleNumber);
                        driver.setVehicles(vehicleRepository.findByRegistrationNumber(vehicleNumber));
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

                Cell valueCheck = row.getCell(11);
                if (valueCheck.getCellType() != CellType.BLANK || valueCheck.getCellType() != CellType.STRING && !valueCheck.getStringCellValue().trim().isEmpty()) {

                    try {
                        Booking booking = new Booking();
                        booking.setBookingNumber(getStringValue(row.getCell(11)));
//                        booking.setStartTime(getDateValue(row.getCell(9)));
                        booking.setStartLocation(getStringValue(row.getCell(6)));
                        booking.setDestination(getStringValue(row.getCell(7)));
                        booking.setNotes(getStringValue(row.getCell(13)));
                        booking.setPRVorShuttle(getStringValue(row.getCell(2)));
                        booking.setArrivalOrDeparture(getStringValue(row.getCell(5)));
                        booking.setBookingDate(getStringValue(row.getCell(14)));

                        Driver driver = new Driver();
                        Cell driverIdCell = row.getCell(8);
                        String driverName = driverIdCell.getStringCellValue();
                        driver = driverRepository.findByName(driverName);
                        booking.setDriverName(driver.getName());

                        bookings.add(booking);
                    } catch (Exception e) {
                        System.err.println("Error processing booking row " + row.getRowNum() + ": " + e.getMessage());
                    }
                } else {
                    break;
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

    private @NotNull LocalDateTime getDateValue(Cell cell) {
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