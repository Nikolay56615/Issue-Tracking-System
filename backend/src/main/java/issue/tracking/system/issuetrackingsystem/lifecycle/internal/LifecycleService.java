package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;
import issue.tracking.system.issuetrackingsystem.lifecycle.internal.GraphTransitionRule;

import java.util.List;

@Service
@RequiredArgsConstructor
class LifecycleService implements LifecycleEngine {

    private final GraphTransitionRule graphRule;
    private final List<TransitionRule> permissionRules; // RoleBased, AssigneeBased...

    @Override
    public boolean canTransition(IssueStatus from, IssueStatus to, String role, boolean isAssignee) {
        // TODO: Прокинуть isAuthor из IssueService, пока false
        boolean isAuthor = false;

        // 1. Проверяем физическую возможность (Граф)
        if (!graphRule.check(from, to, role, isAssignee, isAuthor)) {
            return false;
        }

        // 2. Проверяем права (Permissions)
        // Логика OR: Если хотя бы одно правило разрешает, то ок.
        // (RoleRule скажет true для Админа, AssigneeRule скажет true для Исполнителя)
        return permissionRules.stream()
            // Исключаем сам GraphRule из этого списка, если он там есть, или фильтруем по типу
            .filter(r -> !(r instanceof GraphTransitionRule))
            .anyMatch(rule -> rule.check(from, to, role, isAssignee, isAuthor));
    }
}
