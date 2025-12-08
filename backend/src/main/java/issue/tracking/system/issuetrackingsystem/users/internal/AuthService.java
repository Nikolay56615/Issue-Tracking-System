package issue.tracking.system.issuetrackingsystem.users.internal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.users.api.UserProvider;
import issue.tracking.system.issuetrackingsystem.users.api.UserRegisteredEvent;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements UserProvider {
    private final ApplicationEventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserMapper mapper;

    @Transactional
    public UserDto register(String email, String username, String rawPassword) {
        log.info("Attempting to register user: username={}, email={}", username, email);

        // Validate email format
        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Check for existing email
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration failed: Email already exists: {}", email);
            throw new IllegalArgumentException("Email already exists");
        }

        // Check for existing username
        if (userRepository.existsByUsername(username)) {
            log.warn("Registration failed: Username already exists: {}", username);
            throw new IllegalArgumentException("Username already exists");
        }

        // Create and save user
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setCreatedAt(LocalDateTime.now());

        log.info("Saving user to database: {}", user);
        User savedUser = userRepository.save(user);
        log.info("User saved with ID: {}", savedUser.getId());

        // Publish event
        eventPublisher.publishEvent(new UserRegisteredEvent(
                savedUser.getId(), savedUser.getEmail(), savedUser.getUsername()
        ));

        return mapper.toDto(savedUser);
    }

    public String login(String email, String username, String rawPassword) {
        log.info("Login attempt: email={}, username={}", email, username);

        User user = null;

        // Try to find by email first
        if (email != null && !email.isBlank()) {
            user = userRepository.findByEmail(email).orElse(null);
        }

        // If not found by email, try by username
        if (user == null && username != null && !username.isBlank()) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        if (user == null) {
            log.warn("Login failed: User not found");
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            log.warn("Login failed: Invalid password for user: {}", user.getUsername());
            throw new IllegalArgumentException("Invalid credentials");
        }

        log.info("Login successful for user: {}", user.getUsername());
        return "mock-jwt-token-for-user-" + user.getId();
    }

    private boolean isValidEmail(String email) {
        // Simple email validation
        return email != null && email.contains("@") && email.contains(".");
    }

    @Override
    public java.util.Optional<UserDto> findUserById(Long id) {
        return userRepository.findById(id).map(mapper::toDto);
    }

    @Override
    public java.util.List<UserDto> findUsersByIds(java.util.List<Long> ids) {
        return userRepository.findAllById(ids).stream()
                .map(mapper::toDto)
                .toList();
    }
}