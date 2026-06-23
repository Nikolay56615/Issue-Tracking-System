package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.List;

public record ProjectConfigDto(
    Long projectId,
    List<CustomRoleDto> roles,
    LifecycleConfigDto lifecycle,
    List<CustomFieldDefinitionDto> customFields,
    List<String> fieldOrder,
    List<String> boardCardFieldIds,
    String updatedAt
) {}
