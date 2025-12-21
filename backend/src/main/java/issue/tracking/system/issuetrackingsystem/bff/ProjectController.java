package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.bff.dto.CreateProjectRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.InviteUserRequest;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectCommandApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectQueryApi;
import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import issue.tracking.system.issuetrackingsystem.users.api.UserProvider;
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
    private final UserProvider userProvider;

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
    public List<UserDto> getMembers(@PathVariable Long id) {
        List<Long> memberIds = queryApi.getProjectMemberIds(id);
        return userProvider.findUsersByIds(memberIds);
    }

    @GetMapping("/{id}/invite-candidates")
    public List<UserDto> getInviteCandidates(
        @PathVariable Long id,
        @RequestParam String query
    ) {
        return queryApi.findUsersNotInProject(id, query);
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


}