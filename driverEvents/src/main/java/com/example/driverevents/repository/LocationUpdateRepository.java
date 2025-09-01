package com.example.driverevents.repository;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationUpdateRepository extends JpaRepository<LocationUpdateFromDrivers, Long> {

//    @Query("SELECT lu FROM LocationUpdate lu WHERE lu.booking.id = :bookingId AND lu.sentToExternalApi = false ORDER BY lu.timestamp")

    @Query("SELECT lu FROM LocationUpdateFromDrivers lu ORDER BY lu.timestamp")
    List<LocationUpdateFromDrivers> findUnsentUpdatesByBooking(Long bookingId);

    List<LocationUpdateFromDrivers> findBySentToApiTrue();

}
