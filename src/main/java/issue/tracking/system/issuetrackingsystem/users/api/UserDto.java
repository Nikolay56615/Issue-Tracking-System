package issue.tracking.system.issuetrackingsystem.users.api;

/**
 * Простой объект для передачи данных о пользователе другим модулям.
 * Immutable (неизменяемый).
 */
public record UserDto (
    Long id,
    String email,
    String username
) {}
