package issue.tracking.system.issuetrackingsystem.projects.api;

public record ProjectMemberWithRoleDto(
    Long id,
    String name,
    String email,
    String role
) {}

