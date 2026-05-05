package issue.tracking.system.issuetrackingsystem.lifecycle.api;

import java.util.List;

public record LifecycleGraphDto(
    List<String> statuses,
    List<TransitionDto> transitions
) {}
