package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class AssigneeCompletionRule implements TransitionRule {

    @Override
    public boolean check(String from, String to, String role, boolean isAssignee, boolean isAuthor) {
        return isAssignee || isAuthor;
    }

    @Override
    public List<TransitionDto> describeTransitions() {
        List<TransitionDto> result = new ArrayList<>();
        for (String from : GraphTransitionRule.DEFAULT_STATUS_IDS) {
            for (String to : GraphTransitionRule.DEFAULT_STATUS_IDS) {
                if (!from.equals(to)) {
                    result.add(new TransitionDto(from, to, List.of(), true, true));
                }
            }
        }
        return result;
    }
}
