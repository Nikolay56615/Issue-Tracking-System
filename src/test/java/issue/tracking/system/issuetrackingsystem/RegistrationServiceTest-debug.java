package issue.tracking.system.issuetrackingsystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIT_debug {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void debugTest_WithMap() throws Exception {
        Map<String, String> requestMap = Map.of(
                "username", "testuser",
                "password", "password123",
                "email", "test@example.com"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register-debug")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestMap)))
                .andDo(print())
                .andExpect(status().isOk())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        System.out.println("Debug Response: " + response);
    }

    @Test
    void debugTest_WithManualJson() throws Exception {
        String manualJson = """
            {
                "username": "manualuser",
                "password": "password123",
                "email": "manual@example.com"
            }
            """;

        MvcResult result = mockMvc.perform(post("/api/debug/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(manualJson))
                .andDo(print())
                .andExpect(status().isOk())
                .andReturn();

        System.out.println("Manual JSON Response: " + result.getResponse().getContentAsString());
    }

    @Test
    void register_ShouldReturnSuccess_WhenValidRequest() throws Exception {
        // Используем Map вместо RegistrationRequest для диагностики
        Map<String, String> requestMap = Map.of(
                "username", "finaluser",
                "password", "password123",
                "email", "final@example.com"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestMap)))
                .andDo(print())
                .andReturn();

        // Проверяем статус
        if (result.getResponse().getStatus() == 400) {
            System.out.println("FAILED with 400. Response: " + result.getResponse().getContentAsString());
            // Не падаем сразу, чтобы увидеть ошибку
        } else {
            System.out.println("SUCCESS with 200. Response: " + result.getResponse().getContentAsString());
        }
    }
}