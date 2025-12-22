package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import java.util.List;

public record TransitionRuleInfo(
    IssueStatus from,
    IssueStatus to,
    List<String> allowedRoles,
    boolean authorAllowed,
    boolean assigneeAllowed
) {}

