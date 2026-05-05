package issue.tracking.system.issuetrackingsystem.issue.api;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record IssueDto(
    Long id,
    Long projectId,
    String name,
    String description,
    IssueType type,
    IssuePriority priority,
    String status,
    List<Long> assigneeIds,
    Long authorId,
    LocalDate startDate,
    LocalDate dueDate,
    List<AttachmentDto> attachments,
    Map<String, Object> customFields
) {}
