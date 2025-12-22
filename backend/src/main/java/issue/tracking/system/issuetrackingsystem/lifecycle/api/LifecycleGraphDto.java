package issue.tracking.system.issuetrackingsystem.lifecycle.api;

import java.util.List;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;

public record LifecycleGraphDto(
    List<IssueStatus> statuses,
    List<TransitionDto> transitions
) {}
