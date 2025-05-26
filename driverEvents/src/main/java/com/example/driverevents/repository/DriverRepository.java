package com.example.driverevents.repository;

import com.example.driverevents.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@EnableJpaRepositories
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Driver findByName(String name);
    List<Driver> findByStatus(Driver.DriverStatus status);
//    List<Driver> findByVehicleIsNotNull();
//    List<Driver> findByVehicleIsNull();
}