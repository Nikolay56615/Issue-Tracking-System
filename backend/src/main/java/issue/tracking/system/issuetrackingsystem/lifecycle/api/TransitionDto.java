package issue.tracking.system.issuetrackingsystem.lifecycle.api;

import java.util.List;

public record TransitionDto(
    IssueStatus from,
    IssueStatus to,
    List<String> allowedRoles,
    boolean authorAllowed,
    boolean assigneeAllowed
) {}

