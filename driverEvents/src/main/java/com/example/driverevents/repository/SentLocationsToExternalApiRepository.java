package com.example.driverevents.repository;

import com.example.driverevents.model.LocationUpdateToDb;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SentLocationsToExternalApiRepository  extends JpaRepository<LocationUpdateToDb, Long> {

    @Modifying
    @Query("UPDATE LocationUpdateFromDrivers l SET l.sentToApi = true WHERE l.id = :id")
    void markAsSent(@Param("id") Long id);

    // batch mark multiple locations
    @Modifying
    @Query("UPDATE LocationUpdateFromDrivers l SET l.sentToApi = true WHERE l.id IN :ids")
    void markAllAsSent(@Param("ids") List<Long> ids);

    // Delete location updates by booking ID (for single booking deletion)
    @Modifying
    @Query("DELETE FROM LocationUpdateToDb lu WHERE lu.bookingId = :bookingId")
    int deleteByBookingId(@Param("bookingId") Long bookingId);

    // Delete location updates by multiple booking IDs (for bulk deletion - more efficient)
    @Modifying
    @Query("DELETE FROM LocationUpdateToDb lu WHERE lu.bookingId IN :bookingIds")
    int deleteByBookingIdIn(@Param("bookingIds") List<Long> bookingIds);

}
