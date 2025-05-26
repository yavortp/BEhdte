package com.example.driverevents.repository;

import com.example.driverevents.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

@Repository
@EnableJpaRepositories
public interface DestinationsRepository extends JpaRepository<Destination, Long> {

    Destination findByStartLocationAndEndLocation(String startLocation, String endLocation);
    Destination findByStartLocation(String startLocation);
    Destination findByEndLocation(String endLocation);

}
