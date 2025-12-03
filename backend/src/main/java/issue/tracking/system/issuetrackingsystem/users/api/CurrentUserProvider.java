package issue.tracking.system.issuetrackingsystem.users.api;

import java.util.Optional;

public interface CurrentUserProvider {
    /**
     * Возвращает ID текущего авторизованного пользователя.
     * Не возвращает сущность User, только ID или DTO.
     */
    Long getCurrentUserId();

    Optional<UserDto> getCurrentUser();
}
