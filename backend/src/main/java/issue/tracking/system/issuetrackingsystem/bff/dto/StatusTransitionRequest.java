package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StatusTransitionRequest(
    @NotNull Long issueId,
    @NotBlank IssueStatus from,
    @NotNull IssueStatus to
) {}