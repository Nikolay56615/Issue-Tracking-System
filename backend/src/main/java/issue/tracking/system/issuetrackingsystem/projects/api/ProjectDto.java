package issue.tracking.system.issuetrackingsystem.projects.api;

public record ProjectDto(
    Long id,
    String name,
    Long ownerId,
    boolean archived
) {}
