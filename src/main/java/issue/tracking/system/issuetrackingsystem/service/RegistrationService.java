package issue.tracking.system.issuetrackingsystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import issue.tracking.system.issuetrackingsystem.dto.RegistrationRequest;
import issue.tracking.system.issuetrackingsystem.model.User;
import issue.tracking.system.issuetrackingsystem.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void register(RegistrationRequest request) {
        // Логируем входящие данные
        log.info("Registering user: username={}, email={}",
                request.getUsername(), request.getEmail());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());

        log.info("Saving user: {}", user);
        userRepository.save(user);

        log.info("User registered successfully: {}", user.getUsername());
    }
}
