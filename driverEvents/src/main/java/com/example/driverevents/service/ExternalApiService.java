package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

public class ExternalApiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String API_URL = "http://localhost:8080/booking";             //"https://your.api.endpoint/bookings";

    public void sendBookingToApi(Booking booking) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Booking> request = new HttpEntity<>(booking, headers);

        restTemplate.exchange(API_URL, HttpMethod.PUT, request, Void.class);
    }

    public void updateDriverOrVehicle(String bookingNumber, Booking updatedBooking) {
        String deleteUrl = API_URL + "/" + bookingNumber;
        restTemplate.exchange(deleteUrl, HttpMethod.DELETE, null, Void.class);

        sendBookingToApi(updatedBooking);                                       // re-add with updated info
    }

}
