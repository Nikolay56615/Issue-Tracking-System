package issue.tracking.system.issuetrackingsystem.bff.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProjectMemberRoleRequest(
    @NotBlank String roleId
) {}
