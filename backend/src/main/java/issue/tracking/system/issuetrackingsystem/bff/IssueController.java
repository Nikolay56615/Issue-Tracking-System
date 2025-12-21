package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.bff.dto.ChangeStatusRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.CreateIssueRequest;
import issue.tracking.system.issuetrackingsystem.bff.dto.UpdateIssueRequest;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueCommandApi;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueFilterDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueQueryApi;
import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueCommandApi commandApi;
    private final IssueQueryApi queryApi;
    private final CurrentUserProvider userProvider;

    // --- COMMANDS ---

    @PostMapping
    public Long create(@Valid @RequestBody CreateIssueRequest request) {
        Long userId = userProvider.getCurrentUserId();
        return commandApi.createIssue(
            userId,
            request.projectId(),
            request.name(),
            request.type(),
            request.priority(),
            request.description(),
            request.assigneeIds(),
            request.attachmentFileNames()
        );
    }

    @PutMapping("/{id}")
    public void update(@PathVariable Long id, @Valid @RequestBody UpdateIssueRequest request) {
        Long userId = userProvider.getCurrentUserId();
        commandApi.updateIssue(
            id,
            userId,
            request.name(),
            request.description(),
            request.priority(),
            request.type(),
            request.status(),
            request.assigneeIds(),
            request.attachmentFileNames()
        );
    }

    @PutMapping("/{id}/status")
    public void changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeStatusRequest request) {
        Long userId = userProvider.getCurrentUserId();
        commandApi.changeStatus(id, userId, request.newStatus());
    }

    @DeleteMapping("/{id}")
    public void moveToTrash(@PathVariable Long id) {
        Long userId = userProvider.getCurrentUserId();
        commandApi.moveToTrash(id, userId);
    }

    @PostMapping("/{id}/restore")
    public void restore(@PathVariable Long id) {
        Long userId = userProvider.getCurrentUserId();
        commandApi.restoreFromTrash(id, userId);
    }

    // --- QUERIES ---

    @GetMapping("/{id}")
    public IssueDto getById(@PathVariable Long id) {
        return queryApi.getById(id);
    }

    @PostMapping("/board")
    public List<IssueDto> getBoard(@RequestParam Long projectId,
                                   @RequestBody(required = false) IssueFilterDto filter) {
        return queryApi.getBoardIssues(projectId, filter);
    }

    @GetMapping("/trash")
    public List<IssueDto> getTrash(@RequestParam Long projectId) {
        return queryApi.getTrashBin(projectId);
    }
}