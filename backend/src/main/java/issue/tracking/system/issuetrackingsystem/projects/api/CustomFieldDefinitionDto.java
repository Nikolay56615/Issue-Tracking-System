package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.Map;

public record CustomFieldDefinitionDto(
    String id,
    Long projectId,
    String name,
    String type,
    Boolean required,
    Map<String, Object> config
) {}
