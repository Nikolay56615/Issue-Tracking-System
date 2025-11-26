package issue.tracking.system.issuetrackingsystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import issue.tracking.system.issuetrackingsystem.dto.RegistrationRequest;


import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JacksonDiagnosticTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testJacksonDeserialization() throws Exception {
        String json = "{\"username\":\"testuser\",\"password\":\"password123\",\"email\":\"test@example.com\"}";

        System.out.println("JSON to deserialize: " + json);

        RegistrationRequest request = objectMapper.readValue(json, RegistrationRequest.class);

        System.out.println("Deserialized object: " + request);
        System.out.println("Username: " + request.getUsername());
        System.out.println("Email: " + request.getEmail());
        System.out.println("Password: " + request.getPassword());

        assertNotNull(request.getUsername(), "Username should not be null");
        assertNotNull(request.getEmail(), "Email should not be null");
        assertNotNull(request.getPassword(), "Password should not be null");
    }
}
