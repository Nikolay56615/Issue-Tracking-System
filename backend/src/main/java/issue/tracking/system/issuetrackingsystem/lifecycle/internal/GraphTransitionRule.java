package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;

import java.util.Map;
import java.util.Set;

@Component
@Order(0)
public class GraphTransitionRule implements TransitionRule {

    private static final Map<IssueStatus, Set<IssueStatus>> ALLOWED_TRANSITIONS = Map.of(
        IssueStatus.BACKLOG, Set.of(IssueStatus.IN_PROGRESS),
        IssueStatus.IN_PROGRESS, Set.of(IssueStatus.REVIEW, IssueStatus.BACKLOG),
        IssueStatus.REVIEW, Set.of(IssueStatus.DONE, IssueStatus.IN_PROGRESS),
        IssueStatus.DONE, Set.of(IssueStatus.BACKLOG)
    );

    @Override
    public boolean check(IssueStatus from, IssueStatus to, String role, boolean isAssignee, boolean isAuthor) {
        if (from == to) return true;
        Set<IssueStatus> targets = ALLOWED_TRANSITIONS.getOrDefault(from, Set.of());
        return targets.contains(to);
    }
}
