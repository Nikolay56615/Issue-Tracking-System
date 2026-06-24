package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.CustomFieldDefinitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomStatusDto;
import issue.tracking.system.issuetrackingsystem.projects.api.LifecycleConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTransitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.TransitionConditionDto;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
class ProjectConfigNormalizer {

    ProjectTemplateConfigDto normalize(Long projectId, ProjectTemplateConfigDto config) {
        ProjectTemplateConfigDto fallback = ProjectConfigDefaults.defaultTemplate(projectId);
        ProjectTemplateConfigDto source = config == null ? fallback : config;

        List<CustomRoleDto> roles = Optional.ofNullable(source.roles())
            .filter(items -> !items.isEmpty())
            .orElse(fallback.roles())
            .stream()
            .filter(Objects::nonNull)
            .map(role -> new CustomRoleDto(
                textOr(role.id(), role.name()),
                projectId,
                textOr(role.name(), role.id()),
                role.permissions() == null ? List.of() : role.permissions()
            ))
            .toList();

        if (roles.isEmpty()) {
            roles = ProjectConfigDefaults.defaultRoles(projectId);
        }

        List<CustomStatusDto> statuses = Optional.ofNullable(source.lifecycle())
            .map(LifecycleConfigDto::statuses)
            .filter(items -> !items.isEmpty())
            .orElse(fallback.lifecycle().statuses())
            .stream()
            .filter(Objects::nonNull)
            .map(status -> new CustomStatusDto(
                textOr(status.id(), status.name()),
                projectId,
                textOr(status.name(), status.id()),
                status.displayOrder() == null ? 1 : status.displayOrder(),
                textOr(status.color(), "#64748b"),
                Boolean.TRUE.equals(status.isInitial())
            ))
            .toList();

        if (statuses.isEmpty()) {
            statuses = ProjectConfigDefaults.defaultStatuses(projectId);
        }

        List<CustomRoleDto> normalizedRoles = roles;
        List<ProjectTransitionDto> transitions = Optional.ofNullable(source.lifecycle())
            .map(LifecycleConfigDto::transitions)
            .orElseGet(() -> ProjectConfigDefaults.defaultTransitions(normalizedRoles))
            .stream()
            .filter(Objects::nonNull)
            .map(transition -> normalizeTransition(transition, normalizedRoles))
            .toList();

        List<CustomFieldDefinitionDto> customFields = Optional.ofNullable(source.customFields())
            .orElse(List.of())
            .stream()
            .filter(Objects::nonNull)
            .map(field -> new CustomFieldDefinitionDto(
                textOr(field.id(), field.name()),
                projectId,
                textOr(field.name(), field.id()),
                textOr(field.type(), "text"),
                Boolean.TRUE.equals(field.required()),
                normalizeFieldConfig(textOr(field.type(), "text"), field.config())
            ))
            .toList();

        List<String> fallbackFieldOrder = ProjectConfigDefaults.defaultFieldOrder(customFields);
        Set<String> validFieldIds = new HashSet<>(fallbackFieldOrder);
        List<String> fieldOrder = Optional.ofNullable(source.fieldOrder())
            .filter(items -> !items.isEmpty())
            .orElse(fallbackFieldOrder)
            .stream()
            .filter(validFieldIds::contains)
            .distinct()
            .toList();

        List<String> missing = fallbackFieldOrder.stream()
            .filter(fieldId -> !fieldOrder.contains(fieldId))
            .toList();

        List<String> fallbackBoardCardFieldIds = ProjectConfigDefaults.defaultBoardCardFieldIds(customFields);
        Set<String> validBoardCardFieldIds = new HashSet<>(fallbackFieldOrder);
        validBoardCardFieldIds.remove("name");
        List<String> boardCardFieldIds = Optional.ofNullable(source.boardCardFieldIds())
            .filter(items -> !items.isEmpty())
            .orElse(fallbackBoardCardFieldIds)
            .stream()
            .filter(validBoardCardFieldIds::contains)
            .distinct()
            .toList();

        return new ProjectTemplateConfigDto(
            roles,
            new LifecycleConfigDto(
                Optional.ofNullable(source.lifecycle())
                    .map(LifecycleConfigDto::transitionRulesEnabled)
                    .orElse(fallback.lifecycle().transitionRulesEnabled()),
                statuses,
                transitions
            ),
            customFields,
            java.util.stream.Stream.concat(fieldOrder.stream(), missing.stream()).toList(),
            boardCardFieldIds
        );
    }

    private ProjectTransitionDto normalizeTransition(ProjectTransitionDto transition, List<CustomRoleDto> roles) {
        List<TransitionConditionDto> conditions = Optional.ofNullable(transition.conditions())
            .filter(items -> !items.isEmpty())
            .orElseGet(() -> roles.stream()
                .map(role -> new TransitionConditionDto("role", role.id(), null))
                .toList())
            .stream()
            .filter(Objects::nonNull)
            .map(condition -> new TransitionConditionDto(
                textOr(condition.type(), "role"),
                condition.roleId(),
                condition.customFieldId()
            ))
            .toList();

        return new ProjectTransitionDto(
            textOr(transition.id(), transition.fromStatusId() + "__" + transition.toStatusId()),
            transition.fromStatusId(),
            transition.toStatusId(),
            conditions
        );
    }

    private Map<String, Object> normalizeFieldConfig(String type, Map<String, Object> config) {
        Map<String, Object> source = config == null ? Map.of() : config;
        Map<String, Object> normalized = new LinkedHashMap<>();

        switch (type) {
            case "text" -> {
                Object maxLength = source.get("maxLength");
                if (maxLength != null) {
                    normalized.put("maxLength", toInteger(maxLength, "maxLength"));
                }
            }
            case "number" -> {
                if (source.get("min") != null) {
                    normalized.put("min", toDouble(source.get("min"), "min"));
                }
                if (source.get("max") != null) {
                    normalized.put("max", toDouble(source.get("max"), "max"));
                }
                normalized.put("isInteger", Boolean.TRUE.equals(source.get("isInteger")));
            }
            case "user_reference" -> {
                Object allowedRoleIds = source.get("allowedRoleIds");
                if (allowedRoleIds instanceof Collection<?> collection) {
                    normalized.put("allowedRoleIds", collection.stream()
                        .map(String::valueOf)
                        .filter(value -> !value.isBlank())
                        .distinct()
                        .toList());
                } else {
                    normalized.put("allowedRoleIds", List.of());
                }
            }
            case "enum" -> normalized.put("options", normalizeEnumOptions(source.get("options")));
            default -> {
            }
        }

        return normalized;
    }

    private List<Map<String, Object>> normalizeEnumOptions(Object options) {
        if (!(options instanceof Collection<?> collection)) {
            return List.of();
        }

        List<Map<String, Object>> normalized = new ArrayList<>();
        for (Object item : collection) {
            if (!(item instanceof Map<?, ?> rawOption)) {
                continue;
            }
            String id = String.valueOf(rawOption.get("id"));
            Object rawLabel = rawOption.get("label");
            Object rawColor = rawOption.get("color");
            String label = rawLabel == null ? id : String.valueOf(rawLabel);
            String color = rawColor == null ? "#64748b" : String.valueOf(rawColor);
            if (id == null || id.isBlank() || "null".equals(id)) {
                continue;
            }
            normalized.add(Map.of(
                "id", id,
                "label", label == null || label.isBlank() || "null".equals(label) ? id : label,
                "color", color == null || color.isBlank() || "null".equals(color) ? "#64748b" : color
            ));
        }

        return normalized;
    }

    private int toInteger(Object value, String label) {
        double number = toDouble(value, label);
        if (number % 1 != 0) {
            throw new IllegalArgumentException(label + " must be an integer");
        }
        return (int) number;
    }

    private double toDouble(Object value, String label) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException(label + " must be a number");
        }
    }

    private String textOr(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback == null || fallback.isBlank() ? "item" : fallback;
        }

        return value;
    }
}
