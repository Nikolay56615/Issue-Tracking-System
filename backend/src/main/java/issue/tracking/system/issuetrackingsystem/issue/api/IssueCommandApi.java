package issue.tracking.system.issuetrackingsystem.issue.api;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;

public interface IssueCommandApi {
    Long createIssue(Long userId, Long projectId, String name, IssueType type, IssuePriority priority, String description);
    void changeStatus(Long issueId, Long userId, IssueStatus newStatus);
    void moveToTrash(Long issueId, Long userId);
    void restoreFromTrash(Long issueId, Long userId);
    void updateIssue(Long issueId, Long userId, String name, String description, IssuePriority priority, IssueType type);
}
