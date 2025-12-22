package issue.tracking.system.issuetrackingsystem.issue.api;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;

import java.time.LocalDate;
import java.util.List;

public record IssueDto(
    Long id,
    Long projectId,
    String name,
    String description,
    IssueType type,
    IssuePriority priority,
    IssueStatus status,
    List<Long> assigneeIds,
    Long authorId,
    LocalDate startDate,
    LocalDate dueDate,
    List<AttachmentDto> attachments
) {}
