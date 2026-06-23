package issue.tracking.system.issuetrackingsystem.bff.dto;

import jakarta.validation.constraints.NotNull;

public record ApplyProjectTemplateRequest(
    @NotNull Long sourceProjectId
) {}
