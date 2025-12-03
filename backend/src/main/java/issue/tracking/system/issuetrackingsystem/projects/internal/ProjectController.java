package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
class ProjectController {

    private final ProjectService projectService;
    private final CurrentUserProvider userProvider;

    @PostMapping
    public ProjectDto create(@RequestBody CreateProjectRequest request) {
        Long ownerId = userProvider.getCurrentUserId();
        return projectService.createProject(request.name(), ownerId);
    }

    @PostMapping("/{projectId}/invite")
    public void invite(@PathVariable Long projectId, @RequestBody InviteRequest request) {
        projectService.inviteUser(projectId, request.userId(), request.role());
    }

    record CreateProjectRequest(String name, Long ownerId) {}
    record InviteRequest(Long userId, ProjectRole role) {}
}
