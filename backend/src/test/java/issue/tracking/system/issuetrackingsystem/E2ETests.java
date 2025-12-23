package issue.tracking.system.issuetrackingsystem;

import issue.tracking.system.issuetrackingsystem.bff.dto.RegisterRequest;
import issue.tracking.system.issuetrackingsystem.users.internal.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.ComposeContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.File;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration(classes = IssueTrackingSystemApplication.class)
class E2ETest {

    @Container
    private static final ComposeContainer composeContainer =
            new ComposeContainer(new File("/src/test/resources/compose.yaml"))
                    .withExposedService("postgres", 5432)
                    .withLocalCompose(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        String jdbcUrl = String.format(
                "jdbc:postgresql://%s:%d/testdb",
                composeContainer.getServiceHost("postgres", 5432),
                composeContainer.getServicePort("postgres", 5432)
        );
        registry.add("spring.datasource.url", () -> jdbcUrl);
        registry.add("spring.datasource.username", () -> "testuser");
        registry.add("spring.datasource.password", () -> "testpass");
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanDb() {
        userRepository.deleteAll();
    }

    @AfterEach
    void cleanDbAfter() {
        userRepository.deleteAll();
    }

    @Test
    void shouldAccessPublicPage() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/projects", String.class);
        // Допустим, без авторизации — 401
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}