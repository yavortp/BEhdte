package com.example.driverevents.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.config.path:firebase-service-account.json}")
    private String firebaseConfigPath;

    @Value("${firebase.credentials.json:}")
    private String firebaseCredentialsJson;

    @PostConstruct
    public void initializeFirebase() {
        try {
            GoogleCredentials credentials;

            // Try to load from environment variable first (for production)
            if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isEmpty()) {
                System.out.println("Loading Firebase credentials from environment variable");
                InputStream stream = new ByteArrayInputStream(firebaseCredentialsJson.getBytes());
                credentials = GoogleCredentials.fromStream(stream);
            }
            // Fall back to file (for local development)
            else {
                System.out.println("Loading Firebase credentials from file: " + firebaseConfigPath);
                try {
                    // Try classpath first
                    ClassPathResource resource = new ClassPathResource(firebaseConfigPath);
                    credentials = GoogleCredentials.fromStream(resource.getInputStream());
                } catch (Exception e) {
                    // Fall back to file system
                    FileInputStream serviceAccount = new FileInputStream(firebaseConfigPath);
                    credentials = GoogleCredentials.fromStream(serviceAccount);
                }
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase initialized successfully");
            } else {
                System.out.println("✅ Firebase already initialized");
            }

        } catch (IOException e) {
            System.err.println("❌ Failed to initialize Firebase: " + e.getMessage());
            e.printStackTrace();

        }
    }
}
