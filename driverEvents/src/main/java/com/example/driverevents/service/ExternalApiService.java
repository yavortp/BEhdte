package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.ExternalBookingDTO;
import com.example.driverevents.model.LocationUpdateFromDrivers;
import com.example.driverevents.repository.BookingRepository;
import com.example.driverevents.repository.SentLocationsToExternalApiRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExternalApiService {

    private final SaveSentLocationsToDbService saveSentLocationsToDbService;
    private final SentLocationsToExternalApiRepository sentLocationsToExternalApiRepository;
    private BookingRepository bookingRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BASE_URL = "https://external.api/"; // <-- replace


    public boolean sendBulkBookingsToApi(String bookingNumber, String vehicleReg, ExternalBookingDTO dto) {

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer YOUR_API_KEY");

            HttpEntity<ExternalBookingDTO> request = new HttpEntity<>(dto, headers);

            String url = "https://external.api/bookings/" + bookingNumber + "/vehicles/" + vehicleReg;
            System.out.println("Sending single booking to: " + url);

            ResponseEntity<String> response = new RestTemplate()
                    .exchange(url, HttpMethod.PUT, request, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            System.out.println("Failed to sync bookings - " + e);
            return false;
        }
    }

    public boolean sendSingleBookingToApi(String bookingNumber, String vehicleReg, ExternalBookingDTO dto) {

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer YOUR_API_KEY");

            HttpEntity<ExternalBookingDTO> request = new HttpEntity<>(dto, headers);

            String url = "https://external.api/bookings/" + bookingNumber + "/vehicles/" + vehicleReg;
            System.out.println("Sending single booking to: " + url);

            ObjectMapper mapper = new ObjectMapper();                                               //this prints the payload in the console!
            String jsonPayload = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(dto);
            System.out.println("Payload:\n" + jsonPayload);

            ResponseEntity<String> response = new RestTemplate()
                    .exchange(url, HttpMethod.PUT, request, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            System.out.println("Failed to sync single booking - " + e);
            return false;
        }
    }

    public void sendLocationUpdate(Booking booking, LocationUpdateFromDrivers location) {

        saveSentLocationsToDbService.saveLocationUpdate(booking, location);

        try {
            // 1) Build URL like /bookings/HTX-12345678/vehicles/AB-123-XYZ/location
            String url = String.format(
                    "%s/bookings/%s/vehicles/%s/location",
                    BASE_URL,
                    booking.getBookingNumber(),
                    booking.getVehicle().getRegistrationNumber()
            );

            // 2) Build payload
            Map<String, Object> payload = new HashMap<>();
            LocalDateTime driverLocal = location.getTimestamp();
            ZoneId sofiaZone = ZoneId.of("Europe/Sofia");
            ZonedDateTime sofiaTime = driverLocal.atZone(sofiaZone);
            OffsetDateTime timestampWithOffset = sofiaTime.toOffsetDateTime();
            String iso8601 = timestampWithOffset.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            payload.put("timestamp", iso8601);
            Map<String, Object> loc = new HashMap<>();
            loc.put("lat", location.getLatitude());
            loc.put("lng", location.getLongitude());
            payload.put("location", loc);

            System.out.println("- external api service - PAYLOAD:\n" + payload);

            sentLocationsToExternalApiRepository.markAsSent(location.getId());   // delete after testing! just checking if db flag sets to true

            // 3) Make request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Sent location for booking " +
                        booking.getBookingNumber() + " vehicle " + booking.getVehicle().getRegistrationNumber());

                sentLocationsToExternalApiRepository.markAsSent(location.getId());

            } else {
                System.out.println("Failed to send location. Status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            System.out.println("Error sending location to external API for booking " + booking.getBookingNumber() + " - " + e);
        }
    }
}
