package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueFilterDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
class IssueController {

    private final IssueCommandService commandService;
    private final IssueQueryService queryService;
    private final CurrentUserProvider userProvider;

    // --- COMMANDS (Изменение данных) ---

    @PostMapping
    public Long create(@RequestBody CreateIssueRequest request) {
        Long userId = userProvider.getCurrentUserId();
        return commandService.createIssue(
            userId,
            request.projectId(),
            request.name(),
            request.type(),
            request.priority(),
            request.description()
        );
    }

    @PutMapping("/{id}/status")
    public void changeStatus(@PathVariable Long id, @RequestBody ChangeStatusRequest request) {
        Long userId = userProvider.getCurrentUserId();
        commandService.changeStatus(id, userId, request.newStatus());
    }

    @DeleteMapping("/{id}")
    public void moveToTrash(@PathVariable Long id) {
        Long userId = userProvider.getCurrentUserId();
        commandService.moveToTrash(id, userId);
    }

    @PostMapping("/{id}/restore")
    public void restore(@PathVariable Long id) {
        Long userId = userProvider.getCurrentUserId();
        commandService.restoreFromTrash(id, userId);
    }

    // --- QUERIES (Чтение данных) ---

    @GetMapping("/{id}")
    public IssueDto getById(@PathVariable Long id) {
        return queryService.getById(id);
    }

    @PostMapping("/board") // POST, потому что фильтр может быть сложным объектом
    public List<IssueDto> getBoard(@RequestParam Long projectId,
        @RequestBody(required = false) IssueFilterDto filter) {
        return queryService.getBoardIssues(projectId, filter);
    }

    @GetMapping("/trash")
    public List<IssueDto> getTrash(@RequestParam Long projectId) {
        return queryService.getTrashBin(projectId);
    }

    // DTOs for Requests
    record CreateIssueRequest(Long projectId, String name, IssueType type, IssuePriority priority,
                              String description) {

    }

    record ChangeStatusRequest(IssueStatus newStatus) {

    }
}
