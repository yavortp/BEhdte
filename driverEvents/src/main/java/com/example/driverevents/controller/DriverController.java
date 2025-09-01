package com.example.driverevents.controller;

import com.example.driverevents.model.Driver;
import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.DriverRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.driverevents.repository.VehicleRepository;


import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final VehicleRepository vehicleRepository;

    private final DriverRepository driverRepository;

    @PostMapping
    public ResponseEntity<?> createDriver(@Valid @RequestBody Driver driver) {

        if (driver.getVehicles() != null && driver.getVehicles().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(driver.getVehicles().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            driver.setVehicles(vehicle);
        } else {
            driver.setVehicles(null);
        }
        Driver saved = driverRepository.save(driver);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDriver(@PathVariable Long id, @RequestBody Driver updatedDriver) {

        return driverRepository.findById(id).map(driver -> {
            driver.setName(updatedDriver.getName());
            driver.setPhoneNumber(updatedDriver.getPhoneNumber());
            driver.setEmail(updatedDriver.getEmail());
            if (updatedDriver.getVehicles() != null && updatedDriver.getVehicles().getId() != null) {
                Vehicle vehicle = vehicleRepository.findById(updatedDriver.getVehicles().getId())
                        .orElseThrow(() -> new RuntimeException("Vehicle not found"));
                driver.setVehicles(vehicle);
            } else {
                driver.setVehicles(null);
            }
            return ResponseEntity.ok(driverRepository.save(driver));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDriver(@PathVariable Long id) {
        if (!driverRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        driverRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
