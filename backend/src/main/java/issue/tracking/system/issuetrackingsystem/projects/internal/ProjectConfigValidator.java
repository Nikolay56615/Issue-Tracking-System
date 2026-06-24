package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.CustomFieldDefinitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomStatusDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.TransitionConditionDto;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
class ProjectConfigValidator {

    void validate(Project project, Set<String> activeIssueStatusIds, ProjectTemplateConfigDto config) {
        if (config.roles() == null || config.roles().isEmpty()) {
            throw new IllegalArgumentException("Project must have at least one role");
        }
        if (config.lifecycle() == null || config.lifecycle().statuses() == null || config.lifecycle().statuses().isEmpty()) {
            throw new IllegalArgumentException("Project must have at least one status");
        }

        Set<String> roleIds = uniqueIds(config.roles().stream().map(CustomRoleDto::id).toList(), "Role ids");
        Set<String> statusIds = uniqueIds(config.lifecycle().statuses().stream().map(CustomStatusDto::id).toList(), "Status ids");
        Set<String> customFieldIds = uniqueIds(config.customFields().stream().map(CustomFieldDefinitionDto::id).toList(), "Custom field ids");

        long initialStatuses = config.lifecycle().statuses().stream()
            .filter(status -> Boolean.TRUE.equals(status.isInitial()))
            .count();
        if (initialStatuses != 1) {
            throw new IllegalArgumentException("Exactly one status must be marked as initial");
        }

        validateOwnerCriticalAccess(project, config.roles());

        if (!statusIds.containsAll(activeIssueStatusIds)) {
            throw new IllegalArgumentException("At least one issue uses a status that no longer exists");
        }

        for (ProjectMember member : project.getMembers()) {
            if (!roleIds.contains(member.getRoleId())) {
                throw new IllegalArgumentException("At least one project member is assigned to a missing role");
            }
        }

        for (CustomFieldDefinitionDto field : config.customFields()) {
            validateCustomFieldDefinition(field, roleIds);
        }

        List<String> expectedFieldOrder = ProjectConfigDefaults.defaultFieldOrder(config.customFields());
        Set<String> expectedFieldIds = new HashSet<>(expectedFieldOrder);
        validateExactFieldOrder(config.fieldOrder(), expectedFieldOrder, expectedFieldIds);
        validateBoardCardFieldIds(config.boardCardFieldIds(), expectedFieldIds);

        Map<String, CustomFieldDefinitionDto> customFieldsById = config.customFields().stream()
            .collect(Collectors.toMap(CustomFieldDefinitionDto::id, field -> field));

        for (var transition : config.lifecycle().transitions()) {
            if (!statusIds.contains(transition.fromStatusId()) || !statusIds.contains(transition.toStatusId())) {
                throw new IllegalArgumentException("A transition references a missing status");
            }
            for (TransitionConditionDto condition : Optional.ofNullable(transition.conditions()).orElse(List.of())) {
                if ("role".equals(condition.type()) && !roleIds.contains(condition.roleId())) {
                    throw new IllegalArgumentException("A transition references a missing role");
                }
                if ("field_user_reference".equals(condition.type())) {
                    CustomFieldDefinitionDto field = customFieldsById.get(condition.customFieldId());
                    if (field == null || !"user_reference".equals(field.type())) {
                        throw new IllegalArgumentException("A transition references an invalid user reference field");
                    }
                }
            }
        }
    }

    private void validateOwnerCriticalAccess(Project project, List<CustomRoleDto> roles) {
        Set<String> ownerLikeRoleIds = roles.stream()
            .filter(role -> role.permissions().containsAll(ProjectConfigDefaults.OWNER_CRITICAL_PERMISSIONS))
            .map(CustomRoleDto::id)
            .collect(Collectors.toSet());

        boolean hasOwnerLikeMember = project.getMembers().stream()
            .anyMatch(member -> ownerLikeRoleIds.contains(member.getRoleId()));
        if (!hasOwnerLikeMember) {
            throw new IllegalArgumentException("Project must keep at least one owner");
        }
    }

    private void validateCustomFieldDefinition(CustomFieldDefinitionDto field, Set<String> roleIds) {
        Set<String> validTypes = Set.of(
            "text",
            "number",
            "date",
            "checkbox",
            "user_reference",
            "issue_reference",
            "enum"
        );
        if (!validTypes.contains(field.type())) {
            throw new IllegalArgumentException(field.name() + " has an unsupported type");
        }

        if ("user_reference".equals(field.type())) {
            Object allowedRoleIds = field.config().get("allowedRoleIds");
            if (allowedRoleIds instanceof Collection<?> collection) {
                for (Object roleId : collection) {
                    if (!roleIds.contains(String.valueOf(roleId))) {
                        throw new IllegalArgumentException(field.name() + " references a missing role");
                    }
                }
            }
        }

        if ("enum".equals(field.type())) {
            List<Map<String, Object>> options = enumOptions(field);
            if (options.isEmpty()) {
                throw new IllegalArgumentException(field.name() + " must have at least one enum option");
            }
            uniqueIds(options.stream().map(option -> String.valueOf(option.get("id"))).toList(), field.name() + " enum option ids");
        }
    }

    private void validateExactFieldOrder(
        List<String> fieldOrder,
        List<String> expectedFieldOrder,
        Set<String> expectedFieldIds
    ) {
        if (fieldOrder == null || fieldOrder.size() != expectedFieldOrder.size()) {
            throw new IllegalArgumentException("Field order must include every system and custom field exactly once");
        }

        if (fieldOrder.stream().anyMatch(fieldId -> !expectedFieldIds.contains(fieldId))
            || new HashSet<>(fieldOrder).size() != fieldOrder.size()) {
            throw new IllegalArgumentException("Field order contains an invalid or duplicated field");
        }
    }

    private void validateBoardCardFieldIds(List<String> fieldIds, Set<String> expectedFieldIds) {
        if (fieldIds == null) {
            throw new IllegalArgumentException("Board card field ids must be present");
        }

        if (fieldIds.stream().anyMatch(fieldId -> "name".equals(fieldId) || !expectedFieldIds.contains(fieldId))
            || new HashSet<>(fieldIds).size() != fieldIds.size()) {
            throw new IllegalArgumentException("Board card field ids contain an invalid or duplicated field");
        }
    }

    private Set<String> uniqueIds(List<String> ids, String label) {
        Set<String> unique = new HashSet<>();
        for (String id : ids) {
            if (id == null || id.isBlank() || !unique.add(id)) {
                throw new IllegalArgumentException(label + " must be unique and not blank");
            }
        }
        return unique;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> enumOptions(CustomFieldDefinitionDto field) {
        Object options = field.config().get("options");
        if (!(options instanceof Collection<?> collection)) {
            return List.of();
        }
        return collection.stream()
            .filter(Map.class::isInstance)
            .map(item -> (Map<String, Object>) item)
            .toList();
    }
}
