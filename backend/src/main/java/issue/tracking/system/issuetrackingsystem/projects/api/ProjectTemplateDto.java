package issue.tracking.system.issuetrackingsystem.projects.api;

public record ProjectTemplateDto(
    Long sourceProjectId,
    String sourceProjectName,
    ProjectTemplateConfigDto config
) {}
