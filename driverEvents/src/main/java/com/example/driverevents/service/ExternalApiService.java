package com.example.driverevents.service;

import com.example.driverevents.model.Booking;
import com.example.driverevents.model.LocationUpdate;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


@Service
@RequiredArgsConstructor
public class ExternalApiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String API_URL = "http://localhost:8080/booking";             //"https://your.api.endpoint/bookings";

    public void sendBookingToApi(Booking booking) {
//        PUT /bookings/HTX-12345678/vehicles/AB-123-XYZ
//{
//  "driver": {
//    "name": "Joe", "licenseNumber": "A42", "phoneNumber": "+441273828200", "preferredContactMethod": "VOICE", "contactMethods": ["VOICE", "SMS", "WHATSAPP"]
//  },
//  "vehicle": { "brand": "Toyota", "model": "Prius", "color": "blue", "description": "Branded with 'Acme Transfers'", "registration": "AB-123-XYZ" }
//}
        String url = API_URL + "/bookings/" + booking.getBookingNumber();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<Booking> request = new HttpEntity<>(booking, headers);

        restTemplate.exchange(url, HttpMethod.PUT, request, Void.class);
    }

    public void sendLocationUpdate(LocationUpdate update) {
//          POST /bookings/HTX-12345678/vehicles/AB-123-XYZ/location
//          { "timestamp": "2019-08-17T12:30:00+00:00", "location": {"lat": 50.82109, "lng": -0.141366 } }
        System.out.println(update.toString());

    }

//    public void updateDriverOrVehicle(String bookingNumber, Booking updatedBooking) {
//        String deleteUrl = API_URL + "/" + bookingNumber;
//        restTemplate.exchange(deleteUrl, HttpMethod.DELETE, null, Void.class);
//
//        sendBookingToApi(updatedBooking);                                       // re-add with updated info
//    }

}
