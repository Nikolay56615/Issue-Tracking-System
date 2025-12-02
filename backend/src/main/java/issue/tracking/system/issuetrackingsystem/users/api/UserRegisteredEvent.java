package issue.tracking.system.issuetrackingsystem.users.api;

/**
 * Observer Pattern (через Spring Events).
 * Позволяет модулю Notification узнать о новом пользователе и отправить
 * приветственное письмо, не связывая код жестко.
 */
public record UserRegisteredEvent(
    Long userId,
    String email,
    String username
) {}
