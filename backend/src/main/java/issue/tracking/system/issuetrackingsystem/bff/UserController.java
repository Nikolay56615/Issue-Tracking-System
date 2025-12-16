package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.users.api.UserQueryApi;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryApi userQueryApi;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/me")
    public UserDto getCurrentUser() {
        return currentUserProvider.getCurrentUser()
            .orElseThrow(() -> new IllegalStateException("User not authenticated"));
    }

    @GetMapping("/search")
    public List<UserDto> search(@RequestParam String query) {
        return userQueryApi.searchUsersGlobal(query);
    }
}