package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.Optional;

public interface ProjectConfigQueryApi {
    ProjectConfigDto getOrCreateConfig(Long projectId);
    Optional<CustomRoleDto> getUserRole(Long projectId, Long userId);
    boolean hasPermission(Long projectId, Long userId, String permission);
    boolean hasRole(Long projectId, String roleId);
    Optional<CustomRoleDto> getRoleById(Long projectId, String roleId);
}
