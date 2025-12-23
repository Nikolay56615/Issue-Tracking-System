package issue.tracking.system.issuetrackingsystem.users.internal;

import issue.tracking.system.issuetrackingsystem.users.api.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements AuthApi, UserQueryApi, UserProvider {

    private final UserRepository userRepository;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final AuthenticationManager authenticationManager;

    // --- AUTH API ---

    @Override
    @Transactional
    public UserDto register(String email, String username, String rawPassword) {
        log.info("Registering user: {}", username);
        if (userRepository.existsByEmail(email)) throw new IllegalArgumentException("Email exists");
        if (userRepository.existsByUsername(username)) throw new IllegalArgumentException("Username exists");

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(saved.getId(), saved.getEmail(), saved.getUsername()));

        return mapper.toDto(saved);
    }

    @Override
    public void login(String email, String username, String rawPassword) {
        String principal = null;
        if (email != null && !email.isBlank()) {
            principal = email;
        } else if (username != null && !username.isBlank()) {
            principal = username;
        }
        if (principal == null) {
            throw new IllegalArgumentException("Email or username is required");
        }
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(principal, rawPassword)
            );
        } catch (AuthenticationException ex) {
            // Если оба поля указаны, пробуем второй вариант
            if (email != null && !email.isBlank() && username != null && !username.isBlank() && !email.equals(username)) {
                try {
                    authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(username, rawPassword)
                    );
                    return;
                } catch (AuthenticationException ignored) {}
            }
            throw new SecurityException("Invalid credentials");
        }
    }

    // --- USER QUERY API & PROVIDER ---

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDto> findUserById(Long id) {
        return userRepository.findById(id).map(mapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> findUsersByIds(List<Long> ids) {
        return userRepository.findAllById(ids).stream().map(mapper::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> searchUsersGlobal(String query) {
        if (query == null || query.isBlank()) return List.of();

        String q = query.toLowerCase();
        return userRepository.findAll().stream()
            .filter(u -> u.getUsername().toLowerCase().contains(q)
                || u.getEmail().toLowerCase().contains(q))
            .map(mapper::toDto)
            .limit(10)
            .toList();
    }
}