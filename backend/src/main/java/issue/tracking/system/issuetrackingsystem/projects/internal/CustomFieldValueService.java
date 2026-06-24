package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.issue.internal.IssueRepository;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomFieldDefinitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigDto;
import java.time.LocalDate;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class CustomFieldValueService {

    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;

    Map<String, Object> sanitizeCustomFields(
        ProjectConfigDto config,
        Long projectId,
        Map<String, Object> values,
        Long issueId
    ) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        Map<String, Object> source = values == null ? Map.of() : values;

        for (CustomFieldDefinitionDto field : config.customFields()) {
            Object value = source.get(field.id());
            if (isBlankValue(value)) {
                if ("checkbox".equals(field.type())) {
                    sanitized.put(field.id(), false);
                    continue;
                }
                if (Boolean.TRUE.equals(field.required())) {
                    throw new IllegalArgumentException(field.name() + " is required");
                }
                continue;
            }

            sanitized.put(field.id(), sanitizeCustomFieldValue(projectId, field, value, issueId));
        }

        return sanitized;
    }

    Object sanitizeCustomFieldValue(
        Long projectId,
        CustomFieldDefinitionDto field,
        Object value,
        Long issueId
    ) {
        return switch (field.type()) {
            case "text" -> sanitizeText(field, value);
            case "number" -> sanitizeNumber(field, value);
            case "date" -> sanitizeDate(field, value);
            case "checkbox" -> sanitizeCheckbox(field, value);
            case "user_reference" -> sanitizeUserReference(projectId, field, value);
            case "issue_reference" -> sanitizeIssueReference(projectId, field, value, issueId);
            case "enum" -> sanitizeEnum(field, value);
            default -> throw new IllegalArgumentException(field.name() + " has an unsupported type");
        };
    }

    boolean isBlankValue(Object value) {
        return value == null || (value instanceof String text && text.isBlank());
    }

    List<String> allowedRoleIds(CustomFieldDefinitionDto field) {
        Object allowedRoleIds = field.config().get("allowedRoleIds");
        if (!(allowedRoleIds instanceof Collection<?> collection)) {
            return List.of();
        }
        return collection.stream().map(String::valueOf).toList();
    }

    @SuppressWarnings("unchecked")
    List<Map<String, Object>> enumOptions(CustomFieldDefinitionDto field) {
        Object options = field.config().get("options");
        if (!(options instanceof Collection<?> collection)) {
            return List.of();
        }
        return collection.stream()
            .filter(Map.class::isInstance)
            .map(item -> (Map<String, Object>) item)
            .toList();
    }

    private String sanitizeText(CustomFieldDefinitionDto field, Object value) {
        if (!(value instanceof String text)) {
            throw new IllegalArgumentException(field.name() + " must be text");
        }
        Object maxLength = field.config().get("maxLength");
        if (maxLength != null && text.length() > toInteger(maxLength, "maxLength")) {
            throw new IllegalArgumentException(field.name() + " exceeds max length");
        }
        return text;
    }

    private Object sanitizeNumber(CustomFieldDefinitionDto field, Object value) {
        double number = toDouble(value, field.name());
        if (Boolean.TRUE.equals(field.config().get("isInteger")) && number % 1 != 0) {
            throw new IllegalArgumentException(field.name() + " must be an integer");
        }
        Object min = field.config().get("min");
        if (min != null && number < toDouble(min, "min")) {
            throw new IllegalArgumentException(field.name() + " is below minimum");
        }
        Object max = field.config().get("max");
        if (max != null && number > toDouble(max, "max")) {
            throw new IllegalArgumentException(field.name() + " is above maximum");
        }
        if (Boolean.TRUE.equals(field.config().get("isInteger"))) {
            return (long) number;
        }
        return number;
    }

    private String sanitizeDate(CustomFieldDefinitionDto field, Object value) {
        String text = String.valueOf(value);
        try {
            return LocalDate.parse(text).toString();
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException(field.name() + " must be an ISO date");
        }
    }

    private Boolean sanitizeCheckbox(CustomFieldDefinitionDto field, Object value) {
        if (!(value instanceof Boolean checked)) {
            throw new IllegalArgumentException(field.name() + " must be checked or unchecked");
        }
        return checked;
    }

    private Long sanitizeUserReference(Long projectId, CustomFieldDefinitionDto field, Object value) {
        long userId = toLong(value, field.name());
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        ProjectMember member = project.getMembers().stream()
            .filter(item -> item.getUserId().equals(userId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(field.name() + " references a member outside the project"));

        List<String> allowedRoleIds = allowedRoleIds(field);
        if (!allowedRoleIds.isEmpty() && !allowedRoleIds.contains(member.getRoleId())) {
            throw new IllegalArgumentException(field.name() + " references a member with an invalid role");
        }

        return userId;
    }

    private Long sanitizeIssueReference(Long projectId, CustomFieldDefinitionDto field, Object value, Long issueId) {
        long referencedIssueId = toLong(value, field.name());
        var referencedIssue = issueRepository.findById(referencedIssueId)
            .orElseThrow(() -> new IllegalArgumentException(field.name() + " references an issue outside the project"));
        if (!referencedIssue.getProjectId().equals(projectId) || referencedIssue.getDeletedAt() != null) {
            throw new IllegalArgumentException(field.name() + " references an issue outside the project");
        }
        if (issueId != null && referencedIssue.getId().equals(issueId)) {
            throw new IllegalArgumentException(field.name() + " cannot reference the issue itself");
        }
        return referencedIssueId;
    }

    private String sanitizeEnum(CustomFieldDefinitionDto field, Object value) {
        String optionId = String.valueOf(value);
        boolean exists = enumOptions(field).stream()
            .anyMatch(option -> optionId.equals(String.valueOf(option.get("id"))));
        if (!exists) {
            throw new IllegalArgumentException(field.name() + " references a missing enum option");
        }
        return optionId;
    }

    private int toInteger(Object value, String label) {
        double number = toDouble(value, label);
        if (number % 1 != 0) {
            throw new IllegalArgumentException(label + " must be an integer");
        }
        return (int) number;
    }

    private long toLong(Object value, String label) {
        double number = toDouble(value, label);
        if (number % 1 != 0) {
            throw new IllegalArgumentException(label + " must be an integer");
        }
        return (long) number;
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
}
