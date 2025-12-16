package issue.tracking.system.issuetrackingsystem.bff.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    String email,
    String username,
    @NotBlank String password
) {}
