package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectCommandApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
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
        return new ProjectDto(saved.getId(), saved.getName(), saved.getOwnerId());
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
            .map(p -> new ProjectDto(p.getId(), p.getName(), p.getOwnerId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDto> getMyProjects(Long userId) {
        return projectRepository.findAllByOwnerId(userId).stream()
            .map(p -> new ProjectDto(p.getId(), p.getName(), p.getOwnerId()))
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
    public List<Long> getProjectMemberIds(Long projectId) {
        return projectRepository.findById(projectId)
            .map(project -> project.getMembers().stream()
                .map(ProjectMember::getUserId)
                .toList())
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> findUsersNotInProject(Long projectId, String query) {
        List<Long> memberIds = getProjectMemberIds(projectId);
        Set<Long> memberIdSet = new HashSet<>(memberIds);
        return userQueryApi.searchUsersGlobal(query).stream()
            .filter(u -> !memberIdSet.contains(u.id()))
            .toList();
    }
}