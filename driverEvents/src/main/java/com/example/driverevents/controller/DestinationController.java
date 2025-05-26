package com.example.driverevents.controller;

import com.example.driverevents.model.Destination;
import com.example.driverevents.repository.DestinationsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationsRepository destinationsRepository;

    @PostMapping
    public ResponseEntity<?> createDestination(@RequestBody Destination destination) {
        if (destination.getStartLocation() == null || destination.getEndLocation() == null || destination.getDurationMinutes() == null) {
            return ResponseEntity.badRequest().body("All fields are required");
        }
        Destination saved = destinationsRepository.save(destination);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<Destination>> getDestinations() {
        return ResponseEntity.ok(destinationsRepository.findAll());
    }

    @PutMapping
    public ResponseEntity<?> updateDestination(@PathVariable Long id, @RequestBody Destination updateDestination) {
        return destinationsRepository.findById(id).map(destination -> {
            destination.setStartLocation(updateDestination.getStartLocation());
            destination.setEndLocation(updateDestination.getEndLocation());
            destination.setDurationMinutes(updateDestination.getDurationMinutes());
            return ResponseEntity.ok(destinationsRepository.save(destination));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping
    public ResponseEntity<?> deleteDestination(@PathVariable Long id) {
        if (!destinationsRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        destinationsRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
