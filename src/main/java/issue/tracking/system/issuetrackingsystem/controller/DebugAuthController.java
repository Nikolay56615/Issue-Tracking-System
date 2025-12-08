package issue.tracking.system.issuetrackingsystem.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@Slf4j
public class DebugAuthController {

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> debugRegister(@RequestBody Map<String, Object> requestMap) {
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

    @PostMapping("/register-raw")
    public ResponseEntity<String> debugRegisterRaw(@RequestBody String rawBody) {
        log.info("=== DEBUG REGISTER RAW ===");
        log.info("Raw body: {}", rawBody);
        log.info("Body length: {}", rawBody.length());

        return ResponseEntity.ok("Raw body received: " + rawBody);
    }
}