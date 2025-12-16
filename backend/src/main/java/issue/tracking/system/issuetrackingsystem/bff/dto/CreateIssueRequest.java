package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateIssueRequest(
    @NotNull Long projectId,
    @NotBlank String name,
    @NotNull IssueType type,
    @NotNull IssuePriority priority,
    String description
) {}