package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.bff.dto.StatusTransitionRequest;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueQueryApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lifecycle")
@RequiredArgsConstructor
public class LifecycleController {

    private final LifecycleEngine lifecycleEngine;
    private final IssueQueryApi issueQueryApi;
    private final ProjectAccessApi projectAccessApi;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/can-transition")
    public ResponseEntity<Boolean> canTransition(@RequestBody StatusTransitionRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();

        IssueDto issue = issueQueryApi.getById(request.issueId());
        if (issue == null) {
            return ResponseEntity.badRequest().body(false);
        }

        String userRole = projectAccessApi
            .getUserRole(userId, issue.projectId())
            .orElse(null);

        boolean isAssignee = issue.assigneeId() != null && issue.assigneeId().equals(userId);

        boolean allowed = lifecycleEngine.canTransition(request.from(), request.to(), userRole, isAssignee);

        return ResponseEntity.ok(allowed);
    }
}
