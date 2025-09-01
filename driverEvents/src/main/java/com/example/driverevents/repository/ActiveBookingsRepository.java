package com.example.driverevents.repository;

import com.example.driverevents.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActiveBookingsRepository extends JpaRepository<Booking, Long> {

    @Query("""
        SELECT b 
        FROM Booking b
        JOIN FETCH b.driver d
        JOIN FETCH b.vehicle v
        WHERE b.bookingDate = :date
    """)
    List<Booking> findBookingsForDate(@Param("date") String date);
}
