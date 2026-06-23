package issue.tracking.system.issuetrackingsystem.projects.api;

public record TransitionConditionDto(
    String type,
    String roleId,
    String customFieldId
) {}
