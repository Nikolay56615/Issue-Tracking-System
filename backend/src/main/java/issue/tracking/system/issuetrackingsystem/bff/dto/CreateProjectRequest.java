package issue.tracking.system.issuetrackingsystem.bff.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateProjectRequest(
    @NotBlank String name
) {}
