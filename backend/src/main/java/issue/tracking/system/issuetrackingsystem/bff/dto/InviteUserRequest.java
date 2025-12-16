package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record InviteUserRequest(
    @NotNull Long userId,
    @NotNull ProjectRole role
) {}
