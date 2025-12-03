package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
class RoleTransitionRule implements TransitionRule {

    private static final Set<String> PRIVILEGED_ROLES = Set.of("REVIEWER", "ADMIN", "OWNER");

    @Override
    public boolean check(IssueStatus from, IssueStatus to, String userRole, boolean isAssignee,
        boolean isAuthor) {
        // Reviewer/Admin/Owner... can fully edit
        if (PRIVILEGED_ROLES.contains(userRole)) {
            return true;
        }

        if ("WORKER".equals(userRole)) {
            if (isAssignee && from == IssueStatus.BACKLOG && to == IssueStatus.IN_PROGRESS) {
                return true;
            }
            return isAssignee && from == IssueStatus.IN_PROGRESS && to == IssueStatus.REVIEW;
        }

        // Если роль неизвестна или null — запрет
        return false;
    }
}
