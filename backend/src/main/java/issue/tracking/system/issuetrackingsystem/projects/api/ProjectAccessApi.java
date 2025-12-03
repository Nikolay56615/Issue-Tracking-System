package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.Optional;

public interface ProjectAccessApi {
    /**
     * Проверяет, есть ли у пользователя доступ к проекту.
     * Используется модулем Issues перед созданием задачи.
     */
    boolean hasAccess(Long userId, Long projectId);

    /**
     * Возвращает роль пользователя в проекте.
     * Null, если пользователь не участник.
     * Возвращает строковое представление роли (WORKER, ADMIN...),
     * чтобы не завязывать внешние модули на внутренний Enum.
     */
    Optional<String> getUserRole(Long userId, Long projectId);
}
