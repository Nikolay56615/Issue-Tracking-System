package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomStatusDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTransitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.TransitionConditionDto;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
class ProjectLifecycleService {

    boolean canTransitionIssue(
        ProjectConfigDto config,
        Optional<CustomRoleDto> currentRole,
        boolean globalAdmin,
        Long userId,
        String fromStatusId,
        String toStatusId,
        Long authorId,
        List<Long> assigneeIds,
        Map<String, Object> customFields
    ) {
        if (globalAdmin) {
            return statusExists(config, toStatusId);
        }

        if (!Boolean.TRUE.equals(config.lifecycle().transitionRulesEnabled())) {
            return statusExists(config, toStatusId);
        }

        if (fromStatusId == null || fromStatusId.isBlank() || toStatusId == null || toStatusId.isBlank()) {
            return false;
        }

        if (fromStatusId.equals(toStatusId)) {
            return true;
        }

        Optional<ProjectTransitionDto> transition = config.lifecycle().transitions().stream()
            .filter(item -> fromStatusId.equals(item.fromStatusId()) && toStatusId.equals(item.toStatusId()))
            .findFirst();

        if (transition.isEmpty()) {
            return false;
        }

        if (currentRole.isEmpty() || !currentRole.get().permissions().contains("issue.edit")) {
            return false;
        }
        String currentRoleId = currentRole.get().id();

        return Optional.ofNullable(transition.get().conditions())
            .orElse(List.of())
            .stream()
            .anyMatch(condition -> matchesCondition(
                condition,
                currentRoleId,
                userId,
                authorId,
                assigneeIds,
                customFields
            ));
    }

    String getInitialStatusId(ProjectConfigDto config) {
        return config.lifecycle().statuses().stream()
            .filter(status -> Boolean.TRUE.equals(status.isInitial()))
            .findFirst()
            .or(() -> config.lifecycle().statuses().stream()
                .sorted(java.util.Comparator.comparing(CustomStatusDto::displayOrder))
                .findFirst())
            .map(CustomStatusDto::id)
            .orElseThrow(() -> new IllegalArgumentException("Project has no initial status"));
    }

    String getInitialStatusId(ProjectTemplateConfigDto config) {
        return config.lifecycle().statuses().stream()
            .filter(status -> Boolean.TRUE.equals(status.isInitial()))
            .findFirst()
            .or(() -> config.lifecycle().statuses().stream()
                .sorted(java.util.Comparator.comparing(CustomStatusDto::displayOrder))
                .findFirst())
            .map(CustomStatusDto::id)
            .orElseThrow(() -> new IllegalArgumentException("Project has no initial status"));
    }

    boolean statusExists(ProjectConfigDto config, String statusId) {
        if (statusId == null || statusId.isBlank()) {
            return false;
        }
        return config.lifecycle().statuses().stream()
            .anyMatch(status -> status.id().equals(statusId));
    }

    private boolean matchesCondition(
        TransitionConditionDto condition,
        String currentRoleId,
        Long userId,
        Long authorId,
        List<Long> assigneeIds,
        Map<String, Object> customFields
    ) {
        if (condition == null || condition.type() == null) {
            return false;
        }

        return switch (condition.type()) {
            case "role" -> condition.roleId() != null && condition.roleId().equals(currentRoleId);
            case "author" -> authorId != null && authorId.equals(userId);
            case "assignee" -> assigneeIds != null && assigneeIds.contains(userId);
            case "field_user_reference" -> userMatchesCustomField(userId, customFields, condition.customFieldId());
            default -> false;
        };
    }

    private boolean userMatchesCustomField(
        Long userId,
        Map<String, Object> customFields,
        String customFieldId
    ) {
        if (userId == null || customFields == null || customFieldId == null) {
            return false;
        }

        Object value = customFields.get(customFieldId);
        if (value instanceof Number number) {
            return number.longValue() == userId;
        }
        if (value instanceof String text) {
            return text.equals(String.valueOf(userId));
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream().anyMatch(item -> userMatchesValue(userId, item));
        }

        return false;
    }

    private boolean userMatchesValue(Long userId, Object value) {
        if (value instanceof Number number) {
            return number.longValue() == userId;
        }
        if (value instanceof String text) {
            return text.equals(String.valueOf(userId));
        }

        return false;
    }
}
