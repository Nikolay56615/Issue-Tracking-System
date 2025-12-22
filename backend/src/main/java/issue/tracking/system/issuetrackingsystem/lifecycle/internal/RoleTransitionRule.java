package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
class RoleTransitionRule implements TransitionRule {

    private static final Set<String> PRIVILEGED_ROLES = Set.of("REVIEWER", "ADMIN", "OWNER");

    @Override
    public boolean check(IssueStatus from, IssueStatus to, String userRole, boolean isAssignee,
        boolean isAuthor) {
        if (PRIVILEGED_ROLES.contains(userRole)) {
            return true;
        }

        if ("WORKER".equals(userRole)) {
            if (isAssignee && from == IssueStatus.BACKLOG && to == IssueStatus.IN_PROGRESS) {
                return true;
            }
            return isAssignee && from == IssueStatus.IN_PROGRESS && to == IssueStatus.REVIEW;
        }

        return false;
    }

    @Override
    public List<TransitionDto> describeTransitions() {
        List<TransitionDto> result = new ArrayList<>();
        // REVIEWER, ADMIN, OWNER — любые переходы
        for (var from : IssueStatus.values()) {
            for (var to : IssueStatus.values()) {
                if (from != to) {
                    result.add(new TransitionDto(
                        from,
                        to,
                        List.of("REVIEWER", "ADMIN", "OWNER"),
                        false,
                        false
                    ));
                }
            }
        }
        // WORKER — только определённые переходы
        result.add(new TransitionDto(
            IssueStatus.BACKLOG,
            IssueStatus.IN_PROGRESS,
            List.of("WORKER"),
            false,
            true
        ));
        result.add(new TransitionDto(
            IssueStatus.IN_PROGRESS,
            IssueStatus.REVIEW,
            List.of("WORKER"),
            false,
            true
        ));
        return result;
    }
}
