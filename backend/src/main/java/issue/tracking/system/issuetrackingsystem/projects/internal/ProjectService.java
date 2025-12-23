package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectCommandApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectMemberWithRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectQueryApi;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.users.api.UserQueryApi;
import java.util.HashSet;
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

    @Override
    @Transactional
    public ProjectDto createProject(String name, Long ownerUserId) {
        Project project = new Project(name, ownerUserId);
        project.addMember(ownerUserId, ProjectRole.OWNER);
        Project saved = projectRepository.save(project);
        return new ProjectDto(saved.getId(), saved.getName(), saved.getOwnerId(), saved.isArchived());
    }

    @Override
    @Transactional
    public void inviteUser(Long projectId, Long userId, ProjectRole role) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        project.addMember(userId, role);
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
            .map(ProjectMember::getRole)
            .map(Enum::name);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectMemberWithRoleDto> getProjectMembersWithRoles(Long projectId) {
        return projectRepository.findById(projectId)
            .map(project -> project.getMembers().stream()
                .map(member -> {
                    var user = userQueryApi.findUserById(member.getUserId());
                    return new ProjectMemberWithRoleDto(
                        member.getUserId(),
                        user.map(UserDto::username).orElse("") ,
                        user.map(UserDto::email).orElse("") ,
                        member.getRole().name()
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
        if (!project.getOwnerId().equals(userId)) {
            throw new SecurityException("Only owner can archive project");
        }
        project.setArchived(true);
        projectRepository.save(project);
    }

    @Override
    @Transactional
    public void restoreProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!project.getOwnerId().equals(userId)) {
            throw new SecurityException("Only owner can restore project");
        }
        project.setArchived(false);
        projectRepository.save(project);
    }

    @Override
    @Transactional
    public void removeUser(Long projectId, Long ownerId, Long userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        if (!project.getOwnerId().equals(ownerId)) {
            throw new SecurityException("Only owner can remove members");
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
            .map(member -> member.getRole().name())
            .orElse(null);
    }
}