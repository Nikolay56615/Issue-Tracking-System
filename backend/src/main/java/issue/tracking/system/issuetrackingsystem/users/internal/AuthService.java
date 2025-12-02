package issue.tracking.system.issuetrackingsystem.users.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.users.api.UserProvider;
import issue.tracking.system.issuetrackingsystem.users.api.UserRegisteredEvent;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService implements UserProvider {
    private final ApplicationEventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserMapper mapper;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    @Transactional
    public UserDto register(String email, String username, String rawPassword) {
        // 1. Validation (Logic)
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (userRepository.existsByEmail(email) || userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("User already exists");
        }

        // 2. Creation (State change)
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // 3. Side Effects (Observer)
        eventPublisher.publishEvent(new UserRegisteredEvent(
            savedUser.getId(), savedUser.getEmail(), savedUser.getUsername()
        ));

        return mapper.toDto(savedUser);
    }

    public String login(String email, String username, String rawPassword) {
        User user = userRepository.findByEmail(email)
            .orElse(userRepository.findByUsername(username).orElseThrow(
                () -> new IllegalArgumentException("Invalid credentials")));
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return "mock-jwt-token-for-user-" + user.getId();
    }

    @Override
    public Optional<UserDto> findUserById(Long id) {
        return userRepository.findById(id).map(mapper::toDto);
    }

    @Override
    public List<UserDto> findUsersByIds(List<Long> ids) {
        return userRepository.findAllById(ids).stream()
            .map(mapper::toDto)
            .toList();
    }
}
