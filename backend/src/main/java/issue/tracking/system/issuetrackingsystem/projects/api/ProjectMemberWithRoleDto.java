package issue.tracking.system.issuetrackingsystem.projects.api;

public record ProjectMemberWithRoleDto(
    Long id,
    String name,
    String email,
    String roleId,
    String roleName,
    java.util.List<String> permissions,
    boolean projectOwner
) {}

