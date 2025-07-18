package com.example.driverevents.repository;

import com.example.driverevents.model.Driver;
import com.example.driverevents.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);
    Optional<Vehicle> findByDriver(Driver driver);
    Vehicle findByRegistrationNumber(String number);

    boolean existsByRegistrationNumber(String registrationNumber);

}


