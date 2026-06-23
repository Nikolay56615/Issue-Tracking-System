package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.admin.AdminService;
import issue.tracking.system.issuetrackingsystem.bff.dto.UpdateGlobalAdminRequest;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectDto;
import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/users")
    public List<UserDto> users() {
        requireGlobalAdmin();
        return adminService.getUsers();
    }

    @PutMapping("/users/{id}/global-admin")
    public UserDto setGlobalAdmin(
        @PathVariable Long id,
        @RequestBody UpdateGlobalAdminRequest request
    ) {
        UserDto actor = requireGlobalAdmin();
        return adminService.setGlobalAdmin(actor.id(), id, Boolean.TRUE.equals(request.globalAdmin()));
    }

    @DeleteMapping("/users/{id}")
    public UserDto deactivateUser(@PathVariable Long id) {
        UserDto actor = requireGlobalAdmin();
        return adminService.deactivateUser(actor.id(), id);
    }

    @PostMapping("/users/{id}/restore")
    public UserDto restoreUser(@PathVariable Long id) {
        requireGlobalAdmin();
        return adminService.restoreUser(id);
    }

    @GetMapping("/projects")
    public List<ProjectDto> projects() {
        requireGlobalAdmin();
        return adminService.getProjects();
    }

    @PostMapping("/projects/{id}/archive")
    public void archiveProject(@PathVariable Long id) {
        requireGlobalAdmin();
        adminService.archiveProject(id);
    }

    @PostMapping("/projects/{id}/restore")
    public void restoreProject(@PathVariable Long id) {
        requireGlobalAdmin();
        adminService.restoreProject(id);
    }

    @DeleteMapping("/projects/{id}")
    public void deleteProject(@PathVariable Long id) {
        requireGlobalAdmin();
        adminService.deleteProject(id);
    }

    private UserDto requireGlobalAdmin() {
        UserDto user = currentUserProvider.getCurrentUser()
            .orElseThrow(() -> new SecurityException("Unauthenticated"));
        if (!Boolean.TRUE.equals(user.globalAdmin())) {
            throw new SecurityException("Global admin access required");
        }
        return user;
    }
}
