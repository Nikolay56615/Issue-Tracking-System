package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleGraphDto;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LifecycleService implements LifecycleEngine {

    private final GraphTransitionRule graphRule;

    @Override
    public boolean canTransition(String from, String to, String role, boolean isAssignee, boolean isAuthor) {
        return graphRule.check(from, to, role, isAssignee, isAuthor);
    }

    @Override
    public LifecycleGraphDto getTransitionGraph() {
        List<String> statuses = GraphTransitionRule.DEFAULT_STATUS_IDS;
        List<TransitionDto> transitions = graphRule.describeTransitions();
        return new LifecycleGraphDto(statuses, transitions);
    }
}
