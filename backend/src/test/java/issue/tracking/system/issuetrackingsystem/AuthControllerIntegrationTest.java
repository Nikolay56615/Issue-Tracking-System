package issue.tracking.system.issuetrackingsystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import issue.tracking.system.issuetrackingsystem.users.internal.AuthController;
import issue.tracking.system.issuetrackingsystem.users.internal.AuthService;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void register_ShouldReturnUserDto_WhenValidRequest() throws Exception {
        String requestBody = """
            {
                "email": "test@example.com",
                "username": "testuser",
                "password": "password123"
            }
            """;

        UserDto mockUser = new UserDto(1L, "test@example.com", "testuser");
        when(authService.register(any(), any(), any())).thenReturn(mockUser);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void register_ShouldReturnBadRequest_WhenDuplicateEmail() throws Exception {
        String requestBody = """
            {
                "email": "duplicate@example.com",
                "username": "user2",
                "password": "password456"
            }
            """;

        when(authService.register(any(), any(), any()))
                .thenThrow(new IllegalArgumentException("Email already exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_ShouldReturnToken_WhenValidCredentials() throws Exception {
        String loginBody = """
            {
                "username": "loginuser",
                "password": "password123"
            }
            """;

        when(authService.login(null, "loginuser", "password123"))
                .thenReturn("mock-jwt-token-for-user-1");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(content().string("mock-jwt-token-for-user-1"));
    }
}