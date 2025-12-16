package issue.tracking.system.issuetrackingsystem.bff.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 3) String username,
    @NotBlank @Size(min = 6) String password
) {}
