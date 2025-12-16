package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.bff.dto.LoginRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.RegisterRequest;
import issue.tracking.system.issuetrackingsystem.users.api.AuthApi;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthApi authApi;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        UserDto user = authApi.register(request.email(), request.username(), request.password());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginRequest request) {
        authApi.login(request.email(), request.username(), request.password());
        return ResponseEntity.ok().build(); // Basic Auth — токен не выдаём
    }
}