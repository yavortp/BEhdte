package com.example.driverevents.repository;

import com.example.driverevents.model.Destination;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@EnableJpaRepositories
public interface DestinationsRepository extends JpaRepository<Destination, Long> {

    Destination findByStartLocationAndEndLocation(String startLocation, String endLocation);
    Destination findByStartLocation(String startLocation);
    Destination findByEndLocation(String endLocation);

    List<Destination> findAllByStartLocation(String startLocation);
    List<Destination> findAllByEndLocation(String endLocation);
    List<Destination> findAllByStartLocationAndEndLocation(String startLocation, String endLocation);
    @Query("SELECT d.durationMinutes FROM Destination d WHERE d.startLocation = :from AND d.endLocation = :to")
    Integer findDuration(@Param("from") String startLocation, @Param("to") String endLocation);

//    Integer findDurationForRoute(@NotBlank String startLocation, @NotBlank String endLocation);
}
