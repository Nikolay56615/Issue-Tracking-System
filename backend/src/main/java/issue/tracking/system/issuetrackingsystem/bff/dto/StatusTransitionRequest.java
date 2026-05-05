package issue.tracking.system.issuetrackingsystem.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StatusTransitionRequest(
    @NotNull Long issueId,
    @NotBlank String from,
    @NotNull String to
) {}
