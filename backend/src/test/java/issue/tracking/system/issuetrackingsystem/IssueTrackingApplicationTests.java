package issue.tracking.system.issuetrackingsystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

//@Testcontainers
//@SpringBootTest(classes = IssueTrackingSystemApplication.class)
//@ContextConfiguration(classes = IssueTrackingSystemApplication.class)
//class IssueTrackingSystemApplicationTests {
//
//    static {
//        System.setProperty("DOCKER_HOST", "tcp://localhost:2375");
//        System.setProperty("TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE", "tcp://localhost:2375");
//        System.setProperty("testcontainers.use.proxy", "false");
//        System.setProperty("testcontainers.reuse.enable", "true");
//        System.setProperty("testcontainers.ryuk.disabled", "true");
//        System.setProperty("TESTCONTAINERS_DOCKER_CLIENT_STRATEGY",
//                "org.testcontainers.dockerclient.EnvironmentAndSystemPropertyClientProviderStrategy");
//    }
//
//    @Container
//    private static final PostgreSQLContainer<?> postgres =
//            new PostgreSQLContainer<>("postgres:16")
//                    .withDatabaseName("testdb")
//                    .withUsername("testuser")
//                    .withPassword("testpass");
//
//    @DynamicPropertySource
//    static void configureProperties(DynamicPropertyRegistry registry) {
//        registry.add("spring.datasource.url", postgres::getJdbcUrl);
//        registry.add("spring.datasource.username", postgres::getUsername);
//        registry.add("spring.datasource.password", postgres::getPassword);
//        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
//        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
//        registry.add("spring.flyway.enabled", () -> "false");
//    }
//
//    @Test
//    void contextLoads() {
//        assert postgres.isRunning();
//        System.out.println("✅ PostgreSQL container started successfully!");
//        System.out.println("JDBC URL: " + postgres.getJdbcUrl());
//    }
//}

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class IssueTrackingSystemApplicationTests {
    @Test
    void contextLoads() {
        System.out.println("✅ Test runs without Docker!");
    }
}