package issue.tracking.system.issuetrackingsystem.issue.api;

import java.util.List;
import java.util.Map;

public interface IssueCommandApi {
    IssueDto createIssue(Long userId, Long projectId, String name, IssueType type,
        IssuePriority priority, String description,
        List<Long> assigneeIds, List<AttachmentDto> attachments,
        java.time.LocalDate dueDate, Map<String, Object> customFields);
    void changeStatus(Long issueId, Long userId, String newStatus);
    void moveToTrash(Long issueId, Long userId);
    void restoreFromTrash(Long issueId, Long userId);
    void updateIssue(Long issueId, Long userId, String name, String description,
        IssuePriority priority, IssueType type,
        String status,
        List<Long> assigneeIds,
        List<AttachmentDto> attachments,
        java.time.LocalDate dueDate,
        Map<String, Object> customFields);
    void removeUserFromProject(Long projectId, Long userId);
    void removeAttachment(Long issueId, Long userId, String attachmentUrl);
}
