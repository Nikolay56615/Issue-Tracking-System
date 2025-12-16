package issue.tracking.system.issuetrackingsystem.users.api;

import java.util.List;
import java.util.Optional;

public interface UserQueryApi {
    Optional<UserDto> findUserById(Long id);
    List<UserDto> findUsersByIds(List<Long> ids);
    List<UserDto> searchUsersGlobal(String query);
}
