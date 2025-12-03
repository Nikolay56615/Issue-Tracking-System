package issue.tracking.system.issuetrackingsystem.lifecycle.api;

public interface LifecycleEngine {
    /**
     * Проверяет, разрешен ли переход.
     * @param from текущий статус
     * @param to целевой статус
     * @param userRole роль пользователя в проекте (строка, чтобы не зависеть от enum проекта)
     * @param isAssignee является ли пользователь исполнителем задачи
     * @return true, если переход разрешен
     */
    boolean canTransition(IssueStatus from, IssueStatus to, String userRole, boolean isAssignee);
}
