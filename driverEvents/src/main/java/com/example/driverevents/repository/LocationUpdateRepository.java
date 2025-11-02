package com.example.driverevents.repository;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationUpdateRepository extends JpaRepository<LocationUpdateFromDrivers, Long> {

    @Query("SELECT lu FROM LocationUpdateFromDrivers lu ORDER BY lu.timestamp")
    List<LocationUpdateFromDrivers> findUnsentUpdatesByBooking(Long bookingId);

    int deleteByBookingId(Long bookingId);

    List<LocationUpdateFromDrivers> findBySentToApiIsNullOrderByTimestampAsc();

}
