package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FileProcessingService {
    private final BookingService bookingService;

    public List<Booking> processExcelFile(MultipartFile file) throws IOException {
        List<Booking> bookings = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header row
            if (rows.hasNext()) {
                rows.next();
            }

            while (rows.hasNext()) {
                Row row = rows.next();
                Booking booking = new Booking();

                // Assuming columns are in order: bookingNumber, startTime, startLocation, destination
                booking.setBookingNumber(getCellValueAsString(row.getCell(11)));
//                booking.setStartTime(getCellValueAsDateTime(row.getCell(9)));
                booking.setStartLocation(getCellValueAsString(row.getCell(6)));
                booking.setDestination(getCellValueAsString(row.getCell(7)));
//                booking.setDriver(getCellValueAsString(row.getCell(8)));
                booking.setArrivalOrDeparture(getCellValueAsString(row.getCell(5)));
                booking.setPRVorShuttle(getCellValueAsString(row.getCell(2)));

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