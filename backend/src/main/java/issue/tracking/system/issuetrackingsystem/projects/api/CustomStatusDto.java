package issue.tracking.system.issuetrackingsystem.projects.api;

public record CustomStatusDto(
    String id,
    Long projectId,
    String name,
    Integer displayOrder,
    String color,
    Boolean isInitial
) {}
