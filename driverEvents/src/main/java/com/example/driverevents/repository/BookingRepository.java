package com.example.driverevents.repository;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingNumber(String bookingNumber);
    List<Booking> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Booking> findBySyncedWithApi(boolean syncedWithApi);
    void deleteAllByIdIn(List<Long> ids);

    @Query(value = """
        SELECT b.* FROM bookings b 
        WHERE b.driver_id = :driverId 
        AND :timestamp BETWEEN 
            (TO_DATE(b.booking_date, 'DD.MM.YYYY') + b.start_time - interval '30 minutes') AND
            (TO_DATE(b.booking_date, 'DD.MM.YYYY') + b.start_time + interval '2 hours')
        LIMIT 1
        """, nativeQuery = true)
    Optional<Booking> findActiveBookingForDriver(@Param("driverId") Long driverId,
                                                 @Param("timestamp") LocalDateTime timestamp);

}
