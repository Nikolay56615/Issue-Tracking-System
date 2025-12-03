package issue.tracking.system.issuetrackingsystem.issue.api;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;

import java.time.LocalDate;
import java.util.List;

public record IssueDto(
    Long id,
    String name,
    String description,
    IssueType type,
    IssuePriority priority,
    IssueStatus status,
    Long assigneeId,
    Long authorId,
    LocalDate startDate,
    LocalDate dueDate,
    List<String> attachmentFileNames // Для отображения списка файлов
) {}
