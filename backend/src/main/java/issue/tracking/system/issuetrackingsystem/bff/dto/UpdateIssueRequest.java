package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.issue.api.AttachmentDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record UpdateIssueRequest(
    @NotBlank String name,
    String description,
    @NotNull IssuePriority priority,
    @NotNull IssueType type,
    String status,
    List<Long> assigneeIds,
    List<AttachmentDto> attachments,
    LocalDate dueDate,
    Map<String, Object> customFields
) {}
