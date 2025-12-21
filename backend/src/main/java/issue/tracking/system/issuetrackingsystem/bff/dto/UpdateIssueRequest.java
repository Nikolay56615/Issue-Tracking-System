package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateIssueRequest(
    @NotBlank String name,
    String description,
    @NotNull IssuePriority priority,
    @NotNull IssueType type,
    IssueStatus status,
    List<Long> assigneeIds,
    List<String> attachmentFileNames
) {}
