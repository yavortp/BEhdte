package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import com.example.driverevents.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FileProcessingService {
    private final BookingService bookingService;
    private final DriverRepository driverRepository;

    public List<Booking> processExcelFile(MultipartFile file) throws IOException {
        List<Booking> bookings = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            Map<String, Integer> columnIndexMap = new HashMap<>();

            // Read header
            Row headerRow = rows.next();
            for (Cell cell : headerRow) {
                String header = cell.getStringCellValue().trim().toLowerCase();
                columnIndexMap.put(header, cell.getColumnIndex());
            }

            // Skip header row
            if (rows.hasNext()) {
                rows.next();
            }

            while (rows.hasNext()) {

                Row row = rows.next();
                Booking booking = new Booking();

                if (booking.getBookingNumber() == null || booking.getStartLocation() == null) {
                    continue; // skip invalid row
                }
                // column names are already set in the Map above
                booking.setBookingNumber(getCellValueAsString(row.getCell(columnIndexMap.get("booking number"))));
                booking.setStartTime(getCellValueAsDateTime(row.getCell(columnIndexMap.get("start time"))));
                booking.setStartLocation(getCellValueAsString(row.getCell(columnIndexMap.get("start location"))));
                booking.setDestination(getCellValueAsString(row.getCell(columnIndexMap.get("destination"))));
                booking.setArrivalOrDeparture(getCellValueAsString(row.getCell(columnIndexMap.get("arrival or departure"))));
                booking.setPRVorShuttle(getCellValueAsString(row.getCell(columnIndexMap.get("prvor shuttle"))));

                String driverName = (getCellValueAsString(row.getCell(columnIndexMap.get("driver"))));
                Driver matchedDriver = driverRepository.findByName(driverName);
                if (matchedDriver != null) {
                    booking.setDriver(matchedDriver);
                    booking.setDriverName(matchedDriver.getName());
                } else {
                    booking.setDriver(null);
                    booking.setDriverName(driverName);
                }

                booking.setSyncedWithApi(false);

                bookings.add(bookingService.createBooking(booking));
            }
        }

        return bookings;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return null;
        }
    }

    private LocalDateTime getCellValueAsDateTime(Cell cell) {
        if (cell == null) {
            return null;
        }

        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();
        }

        return null;
    }
}