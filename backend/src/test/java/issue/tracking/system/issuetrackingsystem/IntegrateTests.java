package issue.tracking.system.issuetrackingsystem;

import issue.tracking.system.issuetrackingsystem.IssueTrackingSystemApplication;
import issue.tracking.system.issuetrackingsystem.bff.dto.CreateProjectRequest;
import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectService;
import issue.tracking.system.issuetrackingsystem.users.internal.User;
import issue.tracking.system.issuetrackingsystem.users.internal.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.ComposeContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.File;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ContextConfiguration(classes = IssueTrackingSystemApplication.class)
class ProjectServiceIntegrationTest {

    @Container
    private static final ComposeContainer composeContainer =
            new ComposeContainer(new File("src/test/resources/compose.yaml"))
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
    private ProjectService projectService;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {

    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }
}