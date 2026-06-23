package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.issue.api.AttachmentDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public record CreateIssueRequest(
    @NotNull Long projectId,
    @NotBlank String name,
    @NotNull IssueType type,
    @NotNull IssuePriority priority,
    String description,
    List<Long> assigneeIds,
    List<AttachmentDto> attachments,
    List<String> attachmentFileNames,
    java.time.LocalDate dueDate,
    Map<String, Object> customFields
) {}
