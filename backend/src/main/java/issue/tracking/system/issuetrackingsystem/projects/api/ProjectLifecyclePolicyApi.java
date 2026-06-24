package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.List;
import java.util.Map;

public interface ProjectLifecyclePolicyApi {
    boolean canTransitionIssue(
        Long userId,
        Long projectId,
        String fromStatusId,
        String toStatusId,
        Long authorId,
        List<Long> assigneeIds,
        Map<String, Object> customFields
    );
}
