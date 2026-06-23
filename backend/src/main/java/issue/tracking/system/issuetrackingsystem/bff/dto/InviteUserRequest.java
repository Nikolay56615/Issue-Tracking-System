package issue.tracking.system.issuetrackingsystem.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InviteUserRequest(
    @NotNull Long userId,
    @NotBlank String roleId
) {}
