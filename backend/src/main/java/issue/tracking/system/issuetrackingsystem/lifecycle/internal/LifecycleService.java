package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleGraphDto;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LifecycleService implements LifecycleEngine {

    private final GraphTransitionRule graphRule;
    private final List<TransitionRule> permissionRules; // RoleBased, AssigneeBased...

    @Override
    public boolean canTransition(IssueStatus from, IssueStatus to, String role, boolean isAssignee, boolean isAuthor) {
        if (!graphRule.check(from, to, role, isAssignee, isAuthor)) {
            return false;
        }
        return permissionRules.stream()
            .filter(r -> !(r instanceof GraphTransitionRule))
            .anyMatch(rule -> rule.check(from, to, role, isAssignee, isAuthor));
    }

    @Override
    public LifecycleGraphDto getTransitionGraph() {
        List<IssueStatus> statuses = List.of(IssueStatus.values());
        List<TransitionDto> transitions = new ArrayList<>();
        // Собираем все переходы из всех правил
        transitions.addAll(graphRule.describeTransitions());
        for (TransitionRule rule : permissionRules) {
            transitions.addAll(rule.describeTransitions());
        }
        return new LifecycleGraphDto(statuses, transitions);
    }
}