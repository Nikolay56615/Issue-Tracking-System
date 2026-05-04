package issue.tracking.system.issuetrackingsystem.projects.api;

public interface ProjectCommandApi {
    ProjectDto createProject(String name, Long ownerId);
    void inviteUser(Long projectId, Long userId, String roleId);
    void updateMemberRole(Long projectId, Long actorUserId, Long userId, String roleId);
    void archiveProject(Long projectId, Long userId);
    void restoreProject(Long projectId, Long userId);
    void removeUser(Long projectId, Long ownerId, Long userId);
}
