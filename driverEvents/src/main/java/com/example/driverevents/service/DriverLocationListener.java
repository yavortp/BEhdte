package com.example.driverevents.service;

import com.example.driverevents.model.LocationUpdateFromDrivers;
import jakarta.persistence.PostPersist;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class DriverLocationListener {

    private final ApplicationEventPublisher eventPublisher;

    public DriverLocationListener(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @PostPersist
    public void afterSave(LocationUpdateFromDrivers location) {
        if (!location.isSentToApi()) {
            // Publish async event to process location
            eventPublisher.publishEvent(new DriverLocationCreatedEvent(location));
        }
    }

    public record DriverLocationCreatedEvent(LocationUpdateFromDrivers location) {}

}
