package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import java.util.List;

public record TransitionRuleInfo(
    String from,
    String to,
    List<String> allowedRoles,
    boolean authorAllowed,
    boolean assigneeAllowed
) {}

