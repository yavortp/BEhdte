package com.example.driverevents.controller;

import com.example.driverevents.model.LocationUpdateFromDrivers;
import com.example.driverevents.repository.LocationUpdateRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api")
public class LocationsController {
    @Autowired
    private LocationUpdateRepository locationUpdateRepository;

    @PostMapping("/drivers_locations")
    public ResponseEntity<?> receiveLocation(@RequestHeader("Authorization") String authHeader,
                                             @RequestBody LocationUpdateFromDrivers payload) {
        String token = authHeader.replace("Bearer ", "");

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            String email = decodedToken.getEmail();
            String uid = decodedToken.getUid();
            LocationUpdateFromDrivers newLocation = new LocationUpdateFromDrivers();
            newLocation.setEmail(payload.getEmail());
            newLocation.setLatitude(payload.getLatitude());
            newLocation.setLongitude(payload.getLongitude());
            newLocation.setTimestamp(payload.getTimestamp());
            newLocation.setSentToApi(null);
            locationUpdateRepository.save(newLocation);

            //Now it’s safe to use payload + user info
            return ResponseEntity.ok("Location accepted");

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }
}
