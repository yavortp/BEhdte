package com.example.driverevents.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SPAController {

    @GetMapping(value = {
            "/",
            "/login",
            "/upload",
            "/bookings",
            "/bookings/**",
            "/drivers",
            "/vehicles",
            "/destinations",
            "/locationmap"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
