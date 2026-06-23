package issue.tracking.system.issuetrackingsystem.admin;

import issue.tracking.system.issuetrackingsystem.issue.internal.IssueRepository;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.projects.internal.Project;
import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectConfigRepository;
import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectRepository;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.users.internal.User;
import issue.tracking.system.issuetrackingsystem.users.internal.UserMapper;
import issue.tracking.system.issuetrackingsystem.users.internal.UserRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final ProjectRepository projectRepository;
    private final ProjectConfigRepository projectConfigRepository;
    private final IssueRepository issueRepository;

    @Transactional(readOnly = true)
    public List<UserDto> getUsers() {
        return userRepository.findAll().stream()
            .sorted(Comparator.comparing(User::getId))
            .map(userMapper::toDto)
            .toList();
    }

    @Transactional
    public UserDto setGlobalAdmin(Long actorUserId, Long userId, boolean globalAdmin) {
        User user = requireUser(userId);
        if (!globalAdmin && user.isGlobalAdmin() && userRepository.countByGlobalAdminTrueAndActiveTrue() <= 1) {
            throw new SecurityException("At least one active global admin is required");
        }
        if (actorUserId.equals(userId) && !globalAdmin) {
            throw new SecurityException("Global admin cannot remove their own admin access");
        }
        user.setGlobalAdmin(globalAdmin);
        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto deactivateUser(Long actorUserId, Long userId) {
        if (actorUserId.equals(userId)) {
            throw new SecurityException("Global admin cannot deactivate themselves");
        }
        User user = requireUser(userId);
        if (user.isGlobalAdmin() && userRepository.countByGlobalAdminTrueAndActiveTrue() <= 1) {
            throw new SecurityException("At least one active global admin is required");
        }
        user.setActive(false);
        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto restoreUser(Long userId) {
        User user = requireUser(userId);
        user.setActive(true);
        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> getProjects() {
        return projectRepository.findAll().stream()
            .sorted(Comparator.comparing(Project::getId))
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public void archiveProject(Long projectId) {
        Project project = requireProject(projectId);
        project.setArchived(true);
        projectRepository.save(project);
    }

    @Transactional
    public void restoreProject(Long projectId) {
        Project project = requireProject(projectId);
        project.setArchived(false);
        projectRepository.save(project);
    }

    @Transactional
    public void deleteProject(Long projectId) {
        Project project = requireProject(projectId);
        issueRepository.deleteAll(issueRepository.findByProjectId(projectId));
        projectConfigRepository.deleteById(projectId);
        projectRepository.delete(project);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Project requireProject(Long projectId) {
        return projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    private ProjectDto toDto(Project project) {
        return new ProjectDto(project.getId(), project.getName(), project.getOwnerId(), project.isArchived());
    }
}
