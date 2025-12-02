package issue.tracking.system.issuetrackingsystem.users.api;

import java.util.List;
import java.util.Optional;

/**
 * Interface Segregation Principle:
 * Модулю "Issue" не нужно знать, как регистрировать пользователя.
 * Ему нужно только найти автора задачи.
 */
public interface UserProvider {
    Optional<UserDto> findUserById(Long id);
    List<UserDto> findUsersByIds(List<Long> ids);
}
