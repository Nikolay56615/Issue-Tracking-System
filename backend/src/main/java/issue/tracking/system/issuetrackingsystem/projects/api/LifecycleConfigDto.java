package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.List;

public record LifecycleConfigDto(
    Boolean transitionRulesEnabled,
    List<CustomStatusDto> statuses,
    List<ProjectTransitionDto> transitions
) {}
