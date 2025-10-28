package com.example.driverevents.config;

import java.security.SecureRandom;
import java.time.LocalDateTime;

public class TokenGenerator {

    private static final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a secure random token (64 hex characters)
     * @return 64-character hexadecimal token
     */
    public static String generateToken() {
        byte[] randomBytes = new byte[32]; // 32 bytes = 64 hex chars
        secureRandom.nextBytes(randomBytes);
        return bytesToHex(randomBytes);
    }

    /**
     * Converts byte array to hexadecimal string
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xFF & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Gets default token expiry (1 year from now)
     */
    public static LocalDateTime getDefaultExpiry() {
        return LocalDateTime.now().plusYears(1);
    }

    /**
     * Gets custom token expiry
     */
    public static LocalDateTime getCustomExpiry(int days) {
        return LocalDateTime.now().plusDays(days);
    }
}