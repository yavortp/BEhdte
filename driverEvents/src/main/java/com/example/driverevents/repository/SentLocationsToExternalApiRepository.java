package com.example.driverevents.repository;

import com.example.driverevents.model.LocationUpdateToDb;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SentLocationsToExternalApiRepository  extends JpaRepository<LocationUpdateToDb, Long> {

    @Modifying
    @Query("UPDATE LocationUpdateFromDrivers l SET l.sentToApi = true WHERE l.id = :id")
    void markAsSent(@Param("id") Long id);

    // batch mark multiple locations
    @Modifying
    @Query("UPDATE LocationUpdateFromDrivers l SET l.sentToApi = true WHERE l.id IN :ids")
    void markAllAsSent(@Param("ids") List<Long> ids);

}
