package com.example.driverevents.controller;

import com.example.driverevents.model.Vehicle;
import com.example.driverevents.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    @PostMapping
    public ResponseEntity<?> createVehicle(@RequestBody Vehicle vehicle) {
        if (vehicle.getRegistrationNumber() == null) {
            return ResponseEntity.badRequest().body("Registration number is required");
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping()
    @CrossOrigin(origins = "http://localhost:5173")
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

//    @GetMapping
//    public ResponseEntity<List<Vehicle>> getAllVehicles() {
//        return ResponseEntity.ok(vehicleRepository.findAll());
//    }

    @GetMapping("/available")
    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByStatus(Vehicle.VehicleStatus.AVAILABLE);
    }


    @PutMapping("/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable Long id, @RequestBody Vehicle updatedVehicle) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setRegistrationNumber(updatedVehicle.getRegistrationNumber());
            vehicle.setModel(updatedVehicle.getModel());
            vehicle.setBrand(updatedVehicle.getBrand());
            vehicle.setColor(updatedVehicle.getColor());
            vehicle.setCapacity(updatedVehicle.getCapacity());
            vehicle.setStatus(updatedVehicle.getStatus());
            return ResponseEntity.ok(vehicleRepository.save(vehicle));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
