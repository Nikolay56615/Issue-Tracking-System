package issue.tracking.system.issuetrackingsystem.users.internal;

import org.springframework.stereotype.Component;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;

@Component
public class UserMapper {

    UserDto toDto(User entity) {
        if (entity == null) return null;
        return new UserDto(
                entity.getId(),
                entity.getEmail(),
                entity.getUsername()
        );
    }
}
