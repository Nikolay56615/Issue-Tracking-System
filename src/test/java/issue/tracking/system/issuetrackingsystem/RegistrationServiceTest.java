package issue.tracking.system.issuetrackingsystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import issue.tracking.system.issuetrackingsystem.dto.RegistrationRequest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void register_ShouldReturnSuccess_WhenValidRequest() throws Exception {
        // Используем RegistrationRequest с конструктором
        RegistrationRequest request = new RegistrationRequest("testuser", "password123", "test@example.com");

        System.out.println("=== TESTING REAL REGISTER ENDPOINT ===");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string("User registered successfully"))
                .andReturn();

        System.out.println("SUCCESS: User registered!");
    }

    @Test
    void register_ShouldReturnBadRequest_WhenDuplicateUsername() throws Exception {
        // Первый пользователь
        RegistrationRequest request1 = new RegistrationRequest("duplicateuser", "password123", "test1@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Второй пользователь с тем же username
        RegistrationRequest request2 = new RegistrationRequest("duplicateuser", "password456", "test2@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username already exists"));
    }

    @Test
    void register_ShouldReturnBadRequest_WhenDuplicateEmail() throws Exception {
        // Первый пользователь
        RegistrationRequest request1 = new RegistrationRequest("user1", "password123", "duplicate@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Второй пользователь с тем же email
        RegistrationRequest request2 = new RegistrationRequest("user2", "password456", "duplicate@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email already exists"));
    }

    @Test
    void register_ShouldReturnBadRequest_WhenInvalidData() throws Exception {
        // Слишком короткий username
        RegistrationRequest request = new RegistrationRequest("ab", "123", "invalid-email");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }
}