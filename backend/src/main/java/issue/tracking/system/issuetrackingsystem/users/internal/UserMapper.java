package issue.tracking.system.issuetrackingsystem.users.internal;

import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User entity) {
        if (entity == null) {
            return null;
        }
        return new UserDto(entity.getId(), entity.getEmail(), entity.getUsername());
    }
}
