package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateIssueRequest(
    @NotBlank String name,
    @NotBlank String description,
    @NotNull IssuePriority priority,
    @NotNull IssueType type
) {}
