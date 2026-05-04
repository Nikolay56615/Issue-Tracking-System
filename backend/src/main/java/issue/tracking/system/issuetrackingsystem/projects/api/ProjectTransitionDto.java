package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.List;

public record ProjectTransitionDto(
    String id,
    String fromStatusId,
    String toStatusId,
    List<TransitionConditionDto> conditions
) {}
