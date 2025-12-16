package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;

import java.util.List;

@Service
@RequiredArgsConstructor
class LifecycleService implements LifecycleEngine {

    private final GraphTransitionRule graphRule;
    private final List<TransitionRule> permissionRules; // RoleBased, AssigneeBased...

    @Override
    public boolean canTransition(IssueStatus from, IssueStatus to, String role, boolean isAssignee) {
        boolean isAuthor = false;

        if (!graphRule.check(from, to, role, isAssignee, isAuthor)) {
            return false;
        }

        return permissionRules.stream()
            .filter(r -> !(r instanceof GraphTransitionRule))
            .anyMatch(rule -> rule.check(from, to, role, isAssignee, isAuthor));
    }
}