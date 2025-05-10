package com.example.drivereventsbe.repository;

import com.example.drivereventsbe.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>{
    Optional<Booking> findByBookingNumber(String bookingNumber);
    List<Booking> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Booking> findBySyncedWithApi(boolean syncedWithApi);
}
