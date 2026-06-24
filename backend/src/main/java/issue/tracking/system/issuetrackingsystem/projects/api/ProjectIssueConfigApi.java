package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.Map;

public interface ProjectIssueConfigApi {
    ProjectConfigDto getOrCreateConfig(Long projectId);
    String getInitialStatusId(Long projectId);
    boolean statusExists(Long projectId, String statusId);
    Map<String, Object> sanitizeCustomFields(Long projectId, Map<String, Object> values, Long issueId);
}
