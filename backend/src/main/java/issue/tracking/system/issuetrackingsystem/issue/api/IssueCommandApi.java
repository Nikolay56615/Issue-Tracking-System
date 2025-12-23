package issue.tracking.system.issuetrackingsystem.issue.api;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import java.util.List;

public interface IssueCommandApi {
    IssueDto createIssue(Long userId, Long projectId, String name, IssueType type,
        IssuePriority priority, String description,
        List<Long> assigneeIds, List<String> attachmentFileNames,
        java.time.LocalDate dueDate);
    void changeStatus(Long issueId, Long userId, IssueStatus newStatus);
    void moveToTrash(Long issueId, Long userId);
    void restoreFromTrash(Long issueId, Long userId);
    void updateIssue(Long issueId, Long userId, String name, String description,
        IssuePriority priority, IssueType type,
        IssueStatus status,
        List<Long> assigneeIds,
        List<String> attachmentFileNames);
    void removeUserFromProject(Long projectId, Long userId);
}
