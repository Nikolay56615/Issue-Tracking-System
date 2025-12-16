package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeStatusRequest(
    @NotNull IssueStatus newStatus
) {}
