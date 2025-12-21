package issue.tracking.system.issuetrackingsystem.users.api;

import java.util.Optional;

public interface CurrentUserProvider {
    Long getCurrentUserId();

    Optional<UserDto> getCurrentUser();
}
