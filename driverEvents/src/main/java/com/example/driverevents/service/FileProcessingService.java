package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FileProcessingService {
    private final BookingService bookingService;
    private final DriverRepository driverRepository;
    private final BookingRepository bookingRepository;

    public List<Booking> processExcelFile(MultipartFile file) throws IOException {
        List<Booking> bookings = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            // map with header names
            Map<String, Integer> columnIndexMap = new HashMap<>();

            // Read header and save names in map above
            Row headerRow = rows.next();
            for (Cell cell : headerRow) {
                String header = cell.getStringCellValue().trim().toLowerCase();
                columnIndexMap.put(header, cell.getColumnIndex());
            }

            while (rows.hasNext()) {

                Row row = rows.next();
                String guard = getCellValueAsString(row.getCell(0));
                if (guard.isBlank()) {
                    break;
                }

                try {
                    Booking booking = new Booking();
//                    String bookingNumber = getCellValueAsString(row.getCell(columnIndexMap.get("booking number"))).trim();

                    // column names are already set in the Map above
                    booking.setBookingNumber(getCellValueAsString(row.getCell(columnIndexMap.get("booking number"))).trim());

                    if (booking.getBookingNumber() == null) {
                        continue;
                    }

                    booking.setStartLocation(getCellValueAsString(row.getCell(columnIndexMap.get("from"))).toUpperCase().trim());
                    booking.setDestination(getCellValueAsString(row.getCell(columnIndexMap.get("destination"))).toUpperCase().trim());
                    booking.setArrivalOrDeparture(getCellValueAsString(row.getCell(columnIndexMap.get("type"))).toUpperCase().trim());
                    booking.setPRVorShuttle(getCellValueAsString(row.getCell(columnIndexMap.get("transp"))).toUpperCase().trim());
                    Cell dateCell = row.getCell(columnIndexMap.get("date"));
                    Cell timeCell = row.getCell(columnIndexMap.get("start time"));
                    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                    LocalTime startTime = extractLocalTime(timeCell, timeFormatter);
                    booking.setStartTime(startTime);
                    booking.setBookingDate(dateCell.getStringCellValue().trim());

                    String driverName = (getCellValueAsString(row.getCell(columnIndexMap.get("driver"))));
                    driverName = driverName.trim().toLowerCase();
                    Optional<Driver> matchedDriverOpt = driverRepository.findByNameIgnoreCase(driverName);
                    if (matchedDriverOpt.isPresent()) {
                        Driver matchedDriver = matchedDriverOpt.get();
                        booking.setDriver(matchedDriver);
                        booking.setDriverName(matchedDriver.getName());
                        Vehicle vehicle = matchedDriver.getVehicles();
                        booking.setVehicle(vehicle);
                        booking.setVehicleNumber(vehicle.getRegistrationNumber());
                    } else {
                        booking.setDriver(null);
                        booking.setDriverName(driverName);
                    }
                    booking.setSyncedWithApi(false);

                    Optional<Booking> existingBookingOpt = bookingRepository.findByBookingNumber(booking.getBookingNumber());

                    if (existingBookingOpt.isPresent()) {
                        Booking updatedBooking = bookingService.updateBooking(existingBookingOpt.get().getId(), booking);
                        bookings.add(bookingRepository.save(updatedBooking));
                    } else {
                        bookings.add(bookingService.createBooking(booking));
                    }
//                    bookings.add(bookingService.createBooking(booking));
                } catch (Exception e) {
//                    System.out.println("❌ Crash at row " + row.getRowNum() + ": " + e.getMessage());
                    e.printStackTrace();
                    continue;
                }
            }
        }
        return bookings;
    }



    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return "";
        }
    }

    private LocalTime extractLocalTime(Cell timeCell, DateTimeFormatter timeFormatter) {
        LocalTime timePart;

        if (timeCell != null) {
            switch (timeCell.getCellType()) {
                case STRING:
                    timePart = LocalTime.parse(timeCell.getStringCellValue().trim(), timeFormatter);
                    break;
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(timeCell)) {
                        timePart = timeCell.getLocalDateTimeCellValue().toLocalTime();
                    } else {
                        timePart = LocalTime.parse(String.valueOf(timeCell.getNumericCellValue()), timeFormatter);
                    }
                    break;
                default:
                    throw new RuntimeException("Unexpected cell type in timeCell");
            }

            return timePart;
        }
        return null;
    }
}