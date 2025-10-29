package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.BookingWindow;
import com.example.driverevents.repository.ActiveBookingsRepository;
import com.example.driverevents.repository.DestinationsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@EnableScheduling
@RequiredArgsConstructor
public class ActiveBookingService {

    private final ActiveBookingsRepository activeBookingsRepository;
    private final DestinationsRepository destinationsRepository;

    private final Map<Long, BookingWindow> activeBookingsCache = new ConcurrentHashMap<>();

    @Scheduled(fixedRate = 300000) // every 5 mins
    public void refreshActiveBookings() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        List<Booking> todaysBookings = activeBookingsRepository.findBookingsForDate(today);

        LocalDateTime now = LocalDateTime.now();

        for (Booking b : todaysBookings) {
            try {
                LocalDate bookingDate = LocalDate.parse(b.getBookingDate(),
                        DateTimeFormatter.ofPattern("dd.MM.yyyy"));
                log.info("Booking date: " + bookingDate);

                LocalDateTime startDateTime = LocalDateTime.of(bookingDate, b.getStartTime());
                log.info("Start time: " + startDateTime);

                Integer durationMinutes = destinationsRepository
                        .findDuration(b.getStartLocation().toUpperCase(), b.getDestination().toUpperCase());
                if (durationMinutes == null) {
                    System.out.println("No duration found for "+ b.getStartLocation() + " - " + b.getDestination());
                    continue;
                }
                log.info("Duration: " + durationMinutes);

                LocalDateTime endDateTime = startDateTime.plusMinutes(durationMinutes);

                log.info("End time: " + endDateTime);

                // Booking is active if we are within [startTime - 30 min, endTime]
                if (!now.isBefore(startDateTime.minusMinutes(30)) && !now.isAfter(endDateTime)) {
                    activeBookingsCache.put(b.getId(),
                            new BookingWindow(b, startDateTime.minusMinutes(30), endDateTime));
                } else {
                    activeBookingsCache.remove(b.getId());                  // delete expired
                }
            } catch (Exception e) {
                // avoid crash if bad data
                e.printStackTrace();
            }
        }
    }

    public List<Booking> getAllActiveBookings() {
        return activeBookingsCache.values().stream().map(BookingWindow::getBooking).collect(Collectors.toList());
    }

    public List<Booking> getActiveBookingsForDriver(String driverUsername) {

        return activeBookingsCache.values().stream()
                .map(BookingWindow::getBooking)
                .filter(b -> b.getDriver() != null
                        && driverUsername.equalsIgnoreCase(b.getDriver().getEmail()))
                .collect(Collectors.toList());
    }
}
