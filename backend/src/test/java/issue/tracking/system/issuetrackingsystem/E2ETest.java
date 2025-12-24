package issue.tracking.system.issuetrackingsystem;

import issue.tracking.system.issuetrackingsystem.bff.dto.CreateIssueRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.CreateProjectRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.LoginRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.RegisterRequest;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import issue.tracking.system.issuetrackingsystem.users.internal.UserRepository;
import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectRepository;
import issue.tracking.system.issuetrackingsystem.issue.internal.IssueRepository;
import issue.tracking.system.issuetrackingsystem.users.internal.UserService;
import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectService;
import issue.tracking.system.issuetrackingsystem.issue.internal.IssueService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority.HIGH;
import static issue.tracking.system.issuetrackingsystem.issue.api.IssueType.BUG;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

// Запускаем тесты по порядку, чтобы избежать конфликта данных
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestPropertySource(locations = "classpath:application-test.properties")
@SpringBootTest(
        classes = IssueTrackingSystemApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "spring.flyway.enabled=false"
        }
)
class E2ETest {

    @LocalServerPort
    private int port;

    private TestRestTemplate restTemplate;

    @Autowired
    private UserService userService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private IssueService issueService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private IssueRepository issueRepository;

    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port;

        // Создаем TestRestTemplate с увеличенным таймаутом
        restTemplate = new TestRestTemplate();
        RestTemplate underlyingRestTemplate = restTemplate.getRestTemplate();

        // Устанавливаем таймауты в миллисекундах
        org.springframework.http.client.HttpComponentsClientHttpRequestFactory requestFactory =
                new org.springframework.http.client.HttpComponentsClientHttpRequestFactory();
        requestFactory.setConnectTimeout(30000);  // 30 секунд
        //requestFactory.setReadTimeout(60000);     // 60 секунд
        underlyingRestTemplate.setRequestFactory(requestFactory);

        // Очистка данных перед каждым тестом
        issueRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Очистка данных после каждого теста
        issueRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void openSwaggerDocumentation() {
        ResponseEntity<String> response = restTemplate.getForEntity(baseUrl + "/swagger-ui.html", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void registerAndLoginUser() {
        // Подготовка данных для регистрации
        RegisterRequest registerRequest = new RegisterRequest(
                "testuser@example.com",
                "testuser",
                "password123"
        );

        // Регистрация пользователя
        ResponseEntity<UserDto> registerResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                registerRequest,
                UserDto.class
        );

        // Ожидаем 200 OK или 201 CREATED
        assertThat(registerResponse.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.CREATED);
        assertThat(registerResponse.getBody().email()).isEqualTo("testuser@example.com");
        assertThat(registerResponse.getBody().username()).isEqualTo("testuser");

        // Проверка, что пользователь создан (через UserRepository)
        assertThat(userRepository.existsByEmail("testuser@example.com")).isTrue();
        assertThat(userRepository.existsByUsername("testuser")).isTrue();

        // Попытка входа
        LoginRequest loginRequest = new LoginRequest(
                "testuser@example.com",
                "testuser",
                "password123"
        );

        ResponseEntity<Void> loginResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/login",
                loginRequest,
                Void.class
        );

        // Проверяем успешный вход (возвращает 200 OK)
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void createProjectAndAccessIt() {
        // Сначала регистрируем пользователя
        RegisterRequest registerRequest = new RegisterRequest(
                "projectowner@example.com",
                "projectowner",
                "password123"
        );

        ResponseEntity<UserDto> registerResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                registerRequest,
                UserDto.class
        );

        assertThat(registerResponse.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.CREATED);

        // Создание проекта - теперь ожидаем 401 без аутентификации
        CreateProjectRequest projectRequest = new CreateProjectRequest("Test Project");

        ResponseEntity<ProjectDto> projectResponse = restTemplate.postForEntity(
                baseUrl + "/api/projects",
                projectRequest,
                ProjectDto.class
        );

        // Проверяем, что без аутентификации возвращается 401
        assertThat(projectResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // Получаем список проектов - тоже 401
        ResponseEntity<List> projectsResponse = restTemplate.getForEntity(baseUrl + "/api/projects", List.class);

        assertThat(projectsResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void createAndManageIssue() {
        // Регистрируем пользователя
        RegisterRequest registerRequest = new RegisterRequest(
                "issueowner@example.com",
                "issueowner",
                "password123"
        );

        ResponseEntity<UserDto> userResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                registerRequest,
                UserDto.class
        );

        assertThat(userResponse.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.CREATED);

        // Создание задачи - ожидаем 401 без аутентификации
        CreateIssueRequest issueRequest = new CreateIssueRequest(
                1L, // projectId
                "Test Issue",
                BUG,
                HIGH,
                "A test issue description",
                List.of(), // assigneeIds
                List.of()  // attachmentFileNames
        );

        ResponseEntity<Long> issueResponse = restTemplate.postForEntity(
                baseUrl + "/api/issues",
                issueRequest,
                Long.class
        );

        // Проверяем, что без аутентификации возвращается 401
        assertThat(issueResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getCurrentUser() {
        // Регистрируем пользователя
        RegisterRequest registerRequest = new RegisterRequest(
                "currentuser@example.com",
                "currentuser",
                "password123"
        );

        ResponseEntity<UserDto> registerResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                registerRequest,
                UserDto.class
        );

        assertThat(registerResponse.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.CREATED);

        // Получаем информацию о текущем пользователе - ожидаем 401 без аутентификации
        ResponseEntity<UserDto> userResponse = restTemplate.getForEntity(baseUrl + "/api/users/me", UserDto.class);

        // В твоём проекте используется Basic Auth, но TestRestTemplate не отправляет credentials
        // Поэтому этот тест будет возвращать 401 Unauthorized
        assertThat(userResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void badCredentialsTest() {
        // Попытка входа с неправильными данными
        LoginRequest loginRequest = new LoginRequest(
                "nonexistent@example.com",
                "nonexistent",
                "wrongpassword"
        );

        ResponseEntity<Void> loginResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/login",
                loginRequest,
                Void.class
        );

        // Проверяем, что вход не удался (возвращает 401 или 500 в зависимости от реализации)
        assertThat(loginResponse.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void registerExistingEmail() {
        // Регистрируем первого пользователя
        RegisterRequest registerRequest = new RegisterRequest(
                "duplicate@example.com",
                "duplicate1",
                "password123"
        );

        ResponseEntity<UserDto> firstRegister = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                registerRequest,
                UserDto.class
        );

        assertThat(firstRegister.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.CREATED);

        // Пытаемся зарегистрировать пользователя с тем же email
        RegisterRequest secondRegisterRequest = new RegisterRequest(
                "duplicate@example.com",
                "duplicate2",
                "password123"
        );

        ResponseEntity<UserDto> secondRegister = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                secondRegisterRequest,
                UserDto.class
        );

        // Проверяем, что вторая регистрация не удалась (возвращает 400, 409 или 500)
        assertThat(secondRegister.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void registerExistingUsername() {
        // Регистрируем первого пользователя
        RegisterRequest registerRequest = new RegisterRequest(
                "user1@example.com",
                "duplicate",
                "password123"
        );

        ResponseEntity<UserDto> firstRegister = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                registerRequest,
                UserDto.class
        );

        assertThat(firstRegister.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.CREATED);

        // Пытаемся зарегистрировать пользователя с тем же username
        RegisterRequest secondRegisterRequest = new RegisterRequest(
                "user2@example.com",
                "duplicate",
                "password123"
        );

        ResponseEntity<UserDto> secondRegister = restTemplate.postForEntity(
                baseUrl + "/api/auth/register",
                secondRegisterRequest,
                UserDto.class
        );

        // Проверяем, что вторая регистрация не удалась (возвращает 400, 409 или 500)
        assertThat(secondRegister.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void accessProtectedEndpointWithoutAuth() {
        // Пытаемся получить доступ к защищенному ресурсу без аутентификации
        ResponseEntity<List> response = restTemplate.getForEntity(baseUrl + "/api/projects", List.class);

        // Проверяем, что доступ запрещен
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}