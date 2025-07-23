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

//    List<Booking> findById(Long id);


    @Query(value = "SELECT * FROM bookings b WHERE b.driver_id = :driverId " +
            "AND :timestamp BETWEEN b.start_time AND b.start_time + interval '30 minutes'",
            nativeQuery = true)
    Optional<Booking> findActiveBookingForDriver(@Param("driverId") Long driverId,
                                                 @Param("timestamp") LocalDateTime timestamp);

    @Query(value = "SELECT * FROM bookings b WHERE " +
            "b.start_time BETWEEN :now AND :now + interval '30 minutes' " +
            "OR :now BETWEEN b.start_time - interval '30 minutes' AND b.start_time + interval '30 minutes'",
            nativeQuery = true)
    List<Booking> findBookingsForLocationUpdates(@Param("now") LocalDateTime now);

}
