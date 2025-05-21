package com.example.driverevents.repository;

import com.example.driverevents.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByName(String name);
    List<Driver> findByStatus(Driver.DriverStatus status);
    List<Driver> findByVehicleIsNotNull();
    List<Driver> findByVehicleIsNull();
}