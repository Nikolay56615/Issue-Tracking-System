package issue.tracking.system.issuetrackingsystem.users.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@RequestBody RegisterRequest request) {
        UserDto user = authService.register(request.email(), request.username(), request.password());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String token = authService.login(request.email(), request.username(), request.password());
        return ResponseEntity.ok(token);
    }

    record RegisterRequest(String email, String username, String password) {}
    record LoginRequest(String email, String username, String password) {}
}
