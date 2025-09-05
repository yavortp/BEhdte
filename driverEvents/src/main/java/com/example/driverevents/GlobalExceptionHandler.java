package com.example.driverevents;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = { IllegalArgumentException.class })
    public ResponseEntity<Map<String, Object>> handleIllegalArgs(IllegalArgumentException ex) {
        String correlationId = generateCorrelationId();
        log.error("Correlation-ID: {} - Illegal argument: {}", correlationId, ex.getMessage(), ex);

        return ResponseEntity.badRequest().body(createErrorResponse(
                "INVALID_REQUEST",
                ex.getMessage(),
                correlationId,
                HttpStatus.BAD_REQUEST.value()
        ));
    }

    @ExceptionHandler(value = { EntityNotFoundException.class })
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(EntityNotFoundException ex) {
        String correlationId = generateCorrelationId();
        log.error("Correlation-ID: {} - Entity not found: {}", correlationId, ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse(
                "RESOURCE_NOT_FOUND",
                ex.getMessage(),
                correlationId,
                HttpStatus.NOT_FOUND.value()
        ));
    }

    @ExceptionHandler(value = { ExternalApiException.class })
    public ResponseEntity<Map<String, Object>> handleExternalApiException(ExternalApiException ex) {
        String correlationId = generateCorrelationId();
        log.error("Correlation-ID: {} - External API error: {}", correlationId, ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(createErrorResponse(
                "EXTERNAL_SERVICE_ERROR",
                "Service temporarily unavailable",
                correlationId,
                HttpStatus.BAD_GATEWAY.value()
        ));
    }

    @ExceptionHandler(value = { Exception.class })
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        String correlationId = generateCorrelationId();
        log.error("Correlation-ID: {} - Unexpected error: {}", correlationId, ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse(
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred",
                correlationId,
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        ));
    }

    private String generateCorrelationId() {
        // Try to get from request header first, otherwise generate new one
        try {
            HttpServletRequest request = ((ServletRequestAttributes)
                    RequestContextHolder.currentRequestAttributes()).getRequest();
            String existingId = request.getHeader("X-Correlation-ID");
            return existingId != null ? existingId : UUID.randomUUID().toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private Map<String, Object> createErrorResponse(String errorCode, String message,
                                                    String correlationId, int status) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", status);
        errorResponse.put("errorCode", errorCode);
        errorResponse.put("message", message);
        errorResponse.put("correlationId", correlationId);
        return errorResponse;
    }
}
