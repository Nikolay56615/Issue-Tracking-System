package issue.tracking.system.issuetrackingsystem.bff.dto;

import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import jakarta.validation.constraints.NotNull;

public record ImportProjectTemplateRequest(
    @NotNull ProjectTemplateConfigDto config
) {}
