package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.bff.dto.ApplyProjectTemplateRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.CreateProjectRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.InviteUserRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.UpdateProjectMemberRoleRequest;
import issue.tracking.system.issuetrackingsystem.projects.api.CurrentProjectRoleResponse;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectCommandApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectMemberWithRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectQueryApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateDto;
import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectConfigService;
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
    private final ProjectConfigService projectConfigService;

    // --- QUERY ---

    @GetMapping
    public List<ProjectDto> getMyProjects() {
        Long userId = currentUserProvider.getCurrentUserId();
        return queryApi.getMyProjects(userId);
    }

    @GetMapping("/{id}")
    public ProjectDto getById(@PathVariable Long id) {
        requireProjectMember(id);
        return queryApi.getProjectById(id)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    @GetMapping("/{id}/members")
    public List<ProjectMemberWithRoleDto> getMembers(@PathVariable Long id) {
        requirePermission(id, "members.view");
        return queryApi.getProjectMembersWithRoles(id);
    }

    @GetMapping("/{id}/invite-candidates")
    public List<UserDto> getInviteCandidates(
        @PathVariable Long id,
        @RequestParam String query
    ) {
        requirePermission(id, "members.invite");
        return queryApi.findUsersNotInProject(id, query);
    }

    @GetMapping("/{id}/my-role")
    public CurrentProjectRoleResponse getMyRole(@PathVariable Long id) {
        Long userId = currentUserProvider.getCurrentUserId();
        return new CurrentProjectRoleResponse(
            projectConfigService.getUserRole(id, userId)
                .orElseThrow(() -> new SecurityException("User is not a member of the project"))
        );
    }

    @GetMapping("/{id}/config")
    public ProjectConfigDto getConfig(@PathVariable Long id) {
        requireProjectMember(id);
        return projectConfigService.getOrCreateConfig(id);
    }

    @PutMapping("/{id}/config")
    public ProjectConfigDto updateConfig(
        @PathVariable Long id,
        @RequestBody ProjectConfigDto config
    ) {
        requirePermission(id, "settings.manage");
        return projectConfigService.saveConfig(id, config);
    }

    @GetMapping("/{id}/template")
    public ProjectTemplateDto exportTemplate(@PathVariable Long id) {
        requirePermission(id, "template.export");
        return projectConfigService.exportTemplate(id);
    }

    @PostMapping("/{id}/template")
    public ProjectConfigDto applyTemplate(
        @PathVariable Long id,
        @Valid @RequestBody ApplyProjectTemplateRequest request
    ) {
        requirePermission(id, "template.apply");
        requireProjectMember(request.sourceProjectId());
        return projectConfigService.applyTemplate(id, request.sourceProjectId());
    }

    // --- COMMAND ---

    @PostMapping
    public ProjectDto create(@Valid @RequestBody CreateProjectRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        ProjectDto project = commandApi.createProject(request.name(), userId);
        if (request.templateProjectId() != null) {
            requireProjectMember(request.templateProjectId());
            projectConfigService.applyTemplate(project.id(), request.templateProjectId());
        }
        return project;
    }

    @PostMapping("/{id}/invite")
    public void invite(@PathVariable Long id, @Valid @RequestBody InviteUserRequest request) {
        requirePermission(id, "members.invite");
        commandApi.inviteUser(id, request.userId(), request.roleId());
    }

    @PutMapping("/{id}/members/{userId}/role")
    public ProjectMemberWithRoleDto updateMemberRole(
        @PathVariable Long id,
        @PathVariable Long userId,
        @Valid @RequestBody UpdateProjectMemberRoleRequest request
    ) {
        Long actorUserId = currentUserProvider.getCurrentUserId();
        commandApi.updateMemberRole(id, actorUserId, userId, request.roleId());
        return queryApi.getProjectMembersWithRoles(id).stream()
            .filter(member -> member.id().equals(userId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Project member not found"));
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
        removeProjectMember(id, userId);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public void removeProjectMember(@PathVariable Long id, @PathVariable Long userId) {
        Long ownerId = currentUserProvider.getCurrentUserId();
        commandApi.removeUser(id, ownerId, userId);
        issueCommandApi.removeUserFromProject(id, userId);
    }

    private void requireProjectMember(Long projectId) {
        Long userId = currentUserProvider.getCurrentUserId();
        projectConfigService.getUserRole(projectId, userId)
            .orElseThrow(() -> new SecurityException("User is not a member of the project"));
    }

    private void requirePermission(Long projectId, String permission) {
        Long userId = currentUserProvider.getCurrentUserId();
        if (!projectConfigService.hasPermission(projectId, userId, permission)) {
            throw new SecurityException("Insufficient project permissions");
        }
    }

}
