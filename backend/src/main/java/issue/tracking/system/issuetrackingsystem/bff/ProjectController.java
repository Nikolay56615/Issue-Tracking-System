package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.bff.dto.CreateProjectRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.InviteUserRequest;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectCommandApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectMemberWithRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectQueryApi;
import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueCommandApi;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectCommandApi commandApi;
    private final ProjectQueryApi queryApi;
    private final CurrentUserProvider currentUserProvider;
    private final IssueCommandApi issueCommandApi;

    // --- QUERY ---

    @GetMapping
    public List<ProjectDto> getMyProjects() {
        Long userId = currentUserProvider.getCurrentUserId();
        return queryApi.getMyProjects(userId);
    }

    @GetMapping("/{id}")
    public ProjectDto getById(@PathVariable Long id) {
        return queryApi.getProjectById(id)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    @GetMapping("/{id}/members")
    public List<ProjectMemberWithRoleDto> getMembers(@PathVariable Long id) {
        return queryApi.getProjectMembersWithRoles(id);
    }

    @GetMapping("/{id}/invite-candidates")
    public List<UserDto> getInviteCandidates(
        @PathVariable Long id,
        @RequestParam String query
    ) {
        return queryApi.findUsersNotInProject(id, query);
    }

    @GetMapping("/{id}/my-role")
    public String getMyRole(@PathVariable Long id) {
        Long userId = currentUserProvider.getCurrentUserId();
        return queryApi.getUserRoleInProject(id, userId);
    }

    // --- COMMAND ---

    @PostMapping
    public ProjectDto create(@Valid @RequestBody CreateProjectRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        return commandApi.createProject(request.name(), userId);
    }

    @PostMapping("/{id}/invite")
    public void invite(@PathVariable Long id, @Valid @RequestBody InviteUserRequest request) {
        commandApi.inviteUser(id, request.userId(), request.role());
    }

    @PostMapping("/{id}/archive")
    public void archive(@PathVariable Long id) {
        Long userId = currentUserProvider.getCurrentUserId();
        commandApi.archiveProject(id, userId);
    }

    @PostMapping("/{id}/restore")
    public void restore(@PathVariable Long id) {
        Long userId = currentUserProvider.getCurrentUserId();
        commandApi.restoreProject(id, userId);
    }

    @PostMapping("/{id}/remove-member/{userId}")
    public void removeMember(@PathVariable Long id, @PathVariable Long userId) {
        Long ownerId = currentUserProvider.getCurrentUserId();
        commandApi.removeUser(id, ownerId, userId);
        issueCommandApi.removeUserFromProject(id, userId);
    }


}