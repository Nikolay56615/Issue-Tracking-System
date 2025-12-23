package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.issue.api.AttachmentDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateIssueRequest(
    @NotNull Long projectId,
    @NotBlank String name,
    @NotNull IssueType type,
    @NotNull IssuePriority priority,
    String description,
    List<Long> assigneeIds,
    List<AttachmentDto> attachments,
    java.time.LocalDate dueDate
) {}