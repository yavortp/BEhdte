package com.example.driverevents.repository;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.LocationUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationUpdateRepository extends JpaRepository<LocationUpdate, Long> {

    List<LocationUpdate> findBySentToApiFalse();
    Optional<LocationUpdate> findFirstByBookingOrderByTimestampDesc(Booking booking);
}
