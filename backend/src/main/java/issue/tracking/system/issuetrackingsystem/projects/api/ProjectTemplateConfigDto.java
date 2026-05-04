package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.List;

public record ProjectTemplateConfigDto(
    List<CustomRoleDto> roles,
    LifecycleConfigDto lifecycle,
    List<CustomFieldDefinitionDto> customFields,
    List<String> fieldOrder
) {}
