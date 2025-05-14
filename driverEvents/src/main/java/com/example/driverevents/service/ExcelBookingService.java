package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.repository.DriverRepository;
import com.example.driverevents.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExcelBookingService {

//    String filePath = "C:\\Users\\yavor\\Desktop\\uploadTest.xlsx";


    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public List<Booking> parseExcelFile(MultipartFile file) {
        List<Booking> bookings = new ArrayList<>();

        try (InputStream is = file.getInputStream();
            Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            if (rowIterator.hasNext()) rowIterator.next();

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();

                Booking booking = new Booking();
                booking.setBookingNumber(getCellValue(row.getCell(0)));
//                booking.setDriver(getCellValue(row.getCell(1)));
//                booking.setVehicle(getCellValue(row.getCell(2)));
                booking.setStartTime(LocalDateTime.parse(getCellValue(row.getCell(3)), formatter));
                booking.setDestination(getCellValue(row.getCell(4)));
                booking.setStartLocation(getCellValue(row.getCell(5)));
                booking.setArrivalOrDeparture(getCellValue(row.getCell(6)).toLowerCase());

                bookings.add(booking);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return bookings;
    }

    private String getCellValue(Cell cell) {
        return cell == null ? "" : cell.toString().trim();
    }
}
