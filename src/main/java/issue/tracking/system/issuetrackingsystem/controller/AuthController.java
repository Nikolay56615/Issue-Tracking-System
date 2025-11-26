package issue.tracking.system.issuetrackingsystem.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import issue.tracking.system.issuetrackingsystem.dto.RegistrationRequest;
import issue.tracking.system.issuetrackingsystem.service.RegistrationService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
@Slf4j
public class AuthController {
    private final RegistrationService registrationService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request) {
        log.info("=== REGISTER ENDPOINT CALLED ===");
        log.info("Received RegistrationRequest: {}", request);
        log.info("Username: '{}', Email: '{}', Password length: {}",
                request.getUsername(), request.getEmail(),
                request.getPassword() != null ? request.getPassword().length() : "null");

        try {
            registrationService.register(request);
            log.info("User registered successfully: {}", request.getUsername());
            return ResponseEntity.ok("User registered successfully");
        } catch (RuntimeException e) {
            log.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register-debug")
    public ResponseEntity<Map<String, Object>> registerDebug(@RequestBody Map<String, Object> requestMap) {
        log.info("=== DEBUG REGISTER ===");
        log.info("Received as Map: {}", requestMap);

        String username = (String) requestMap.get("username");
        String password = (String) requestMap.get("password");
        String email = (String) requestMap.get("email");

        log.info("Extracted - username: '{}', email: '{}', password: '{}'", username, email, password);

        boolean hasNull = username == null || password == null || email == null;

        return ResponseEntity.ok(Map.of(
                "received", requestMap,
                "extracted", Map.of("username", username, "email", email, "password", password),
                "hasNullFields", hasNull,
                "message", hasNull ? "SOME FIELDS ARE NULL!" : "All fields received correctly"
        ));
    }
}
