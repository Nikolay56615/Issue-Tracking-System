package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class GraphTransitionRule implements TransitionRule {

    static final List<String> DEFAULT_STATUS_IDS = List.of(
        "BACKLOG",
        "IN_PROGRESS",
        "REVIEW",
        "DONE"
    );

    @Override
    public boolean check(String from, String to, String role, boolean isAssignee, boolean isAuthor) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            return false;
        }
        if (from.equals(to)) {
            return true;
        }

        return describeTransitions().stream()
            .anyMatch(transition -> from.equals(transition.from()) && to.equals(transition.to()));
    }

    @Override
    public List<TransitionDto> describeTransitions() {
        List<TransitionDto> result = new ArrayList<>();
        result.add(transition("BACKLOG", "IN_PROGRESS", List.of("WORKER", "REVIEWER", "ADMIN", "OWNER")));
        result.add(transition("IN_PROGRESS", "REVIEW", List.of("WORKER", "REVIEWER", "ADMIN", "OWNER")));
        result.add(transition("REVIEW", "DONE", List.of("REVIEWER", "ADMIN", "OWNER")));
        result.add(transition("IN_PROGRESS", "BACKLOG", List.of("REVIEWER", "ADMIN", "OWNER")));
        result.add(transition("REVIEW", "IN_PROGRESS", List.of("REVIEWER", "ADMIN", "OWNER")));
        result.add(transition("DONE", "BACKLOG", List.of("REVIEWER", "ADMIN", "OWNER")));
        return result;
    }

    private TransitionDto transition(String from, String to, List<String> roles) {
        return new TransitionDto(from, to, roles, false, roles.contains("WORKER"));
    }
}
