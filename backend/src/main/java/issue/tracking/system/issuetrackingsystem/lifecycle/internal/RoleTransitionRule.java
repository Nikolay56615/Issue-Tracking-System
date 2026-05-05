package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
class RoleTransitionRule implements TransitionRule {

    private static final Set<String> DEFAULT_ROLES = Set.of("WORKER", "REVIEWER", "ADMIN", "OWNER");

    @Override
    public boolean check(String from, String to, String userRole, boolean isAssignee, boolean isAuthor) {
        return DEFAULT_ROLES.contains(userRole) || isAssignee || isAuthor;
    }

    @Override
    public List<TransitionDto> describeTransitions() {
        List<TransitionDto> result = new ArrayList<>();
        for (String from : GraphTransitionRule.DEFAULT_STATUS_IDS) {
            for (String to : GraphTransitionRule.DEFAULT_STATUS_IDS) {
                if (!from.equals(to)) {
                    result.add(new TransitionDto(
                        from,
                        to,
                        List.copyOf(DEFAULT_ROLES),
                        true,
                        true
                    ));
                }
            }
        }
        return result;
    }
}
