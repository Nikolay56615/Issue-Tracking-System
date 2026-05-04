package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectCommandApi;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectMemberWithRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectQueryApi;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.users.api.UserQueryApi;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService implements ProjectAccessApi, ProjectCommandApi, ProjectQueryApi {

    private final ProjectRepository projectRepository;
    private final UserQueryApi userQueryApi;
    private final ProjectConfigService projectConfigService;

    @Override
    @Transactional
    public ProjectDto createProject(String name, Long ownerUserId) {
        Project project = new Project(name, ownerUserId);
        project.addMember(ownerUserId, ProjectConfigDefaults.OWNER);
        Project saved = projectRepository.save(project);
        projectConfigService.createDefaultConfig(saved.getId());
        return new ProjectDto(saved.getId(), saved.getName(), saved.getOwnerId(), saved.isArchived());
    }

    @Override
    @Transactional
    public void inviteUser(Long projectId, Long userId, String roleId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!projectConfigService.hasRole(projectId, roleId)) {
            throw new IllegalArgumentException("Project role not found");
        }
        project.addMember(userId, roleId);
        projectRepository.save(project);
    }

    @Override
    @Transactional
    public void updateMemberRole(Long projectId, Long actorUserId, Long userId, String roleId) {
        if (!projectConfigService.hasPermission(projectId, actorUserId, "members.assignRole")) {
            throw new SecurityException("Insufficient permissions to assign roles");
        }
        if (!projectConfigService.hasRole(projectId, roleId)) {
            throw new IllegalArgumentException("Project role not found");
        }

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        ProjectMember member = project.getMembers().stream()
            .filter(item -> item.getUserId().equals(userId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Project member not found"));
        member.setRoleId(roleId);
        projectRepository.save(project);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProjectDto> getProjectById(Long id) {
        return projectRepository.findById(id)
            .map(p -> new ProjectDto(p.getId(), p.getName(), p.getOwnerId(), p.isArchived()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDto> getMyProjects(Long userId) {
        List<Project> owned = projectRepository.findAllByOwnerIdAllProjects(userId);
        List<Project> active = projectRepository.findAllActiveByMemberUserId(userId);
        return java.util.stream.Stream.concat(owned.stream(), active.stream())
            .distinct()
            .map(p -> new ProjectDto(p.getId(), p.getName(), p.getOwnerId(), p.isArchived()))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAccess(Long userId, Long projectId) {
        return projectRepository.findById(projectId)
            .map(p -> p.getMembers().stream().anyMatch(m -> m.getUserId().equals(userId)))
            .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> getUserRole(Long userId, Long projectId) {
        return projectRepository.findById(projectId)
            .flatMap(p -> p.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst())
            .map(ProjectMember::getRoleId);
    }

    @Override
    @Transactional
    public boolean hasPermission(Long userId, Long projectId, String permission) {
        return projectConfigService.hasPermission(projectId, userId, permission);
    }

    @Override
    @Transactional
    public boolean canTransitionIssue(
        Long userId,
        Long projectId,
        String fromStatusId,
        String toStatusId,
        Long authorId,
        List<Long> assigneeIds,
        Map<String, Object> customFields
    ) {
        if (!hasAccess(userId, projectId)) {
            return false;
        }

        return projectConfigService.canTransitionIssue(
            projectId,
            userId,
            fromStatusId,
            toStatusId,
            authorId,
            assigneeIds,
            customFields
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectMemberWithRoleDto> getProjectMembersWithRoles(Long projectId) {
        return projectRepository.findById(projectId)
            .map(project -> project.getMembers().stream()
                .map(member -> {
                    var user = userQueryApi.findUserById(member.getUserId());
                    CustomRoleDto role = projectConfigService
                        .getRoleById(projectId, member.getRoleId())
                        .orElse(new CustomRoleDto(
                            member.getRoleId(),
                            projectId,
                            member.getRoleId(),
                            List.of()
                        ));
                    return new ProjectMemberWithRoleDto(
                        member.getUserId(),
                        user.map(UserDto::username).orElse("") ,
                        user.map(UserDto::email).orElse("") ,
                        role.id(),
                        role.name(),
                        role.permissions()
                    );
                })
                .toList())
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> findUsersNotInProject(Long projectId, String query) {
        List<Long> memberIds = projectRepository.findById(projectId)
            .map(project -> project.getMembers().stream()
                .map(ProjectMember::getUserId)
                .toList())
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        Set<Long> memberIdSet = new HashSet<>(memberIds);
        return userQueryApi.searchUsersGlobal(query).stream()
            .filter(u -> !memberIdSet.contains(u.id()))
            .toList();
    }

    @Override
    public List<Long> getProjectMemberIds(Long projectId) {
        return projectRepository.findById(projectId)
                .map(project -> project.getMembers().stream()
                        .map(ProjectMember::getUserId)
                        .collect(Collectors.toList()))
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    @Override
    @Transactional
    public void archiveProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!projectConfigService.hasPermission(projectId, userId, "project.archive")) {
            throw new SecurityException("Insufficient permissions to archive project");
        }
        project.setArchived(true);
        projectRepository.save(project);
    }

    @Override
    @Transactional
    public void restoreProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!projectConfigService.hasPermission(projectId, userId, "project.restore")) {
            throw new SecurityException("Insufficient permissions to restore project");
        }
        project.setArchived(false);
        projectRepository.save(project);
    }

    @Override
    @Transactional
    public void removeUser(Long projectId, Long ownerId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!projectConfigService.hasPermission(projectId, ownerId, "members.remove")) {
            throw new SecurityException("Insufficient permissions to remove members");
        }
        if (ownerId.equals(userId)) {
            throw new SecurityException("Owner cannot remove themselves");
        }
        boolean removed = project.getMembers().removeIf(m -> m.getUserId().equals(userId));
        if (removed) {
            projectRepository.save(project);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getUserRoleInProject(Long projectId, Long userId) {
        return projectRepository.findById(projectId)
            .flatMap(p -> p.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst())
            .map(ProjectMember::getRoleId)
            .orElse(null);
    }
}
