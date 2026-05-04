package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.List;

public record CustomRoleDto(
    String id,
    Long projectId,
    String name,
    List<String> permissions
) {}
