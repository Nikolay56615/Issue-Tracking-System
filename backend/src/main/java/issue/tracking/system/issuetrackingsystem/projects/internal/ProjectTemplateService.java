package issue.tracking.system.issuetrackingsystem.projects.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import issue.tracking.system.issuetrackingsystem.issue.internal.Issue;
import issue.tracking.system.issuetrackingsystem.issue.internal.IssueRepository;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomFieldDefinitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomStatusDto;
import issue.tracking.system.issuetrackingsystem.projects.api.LifecycleConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTransitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.TransitionConditionDto;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ProjectTemplateService {

    private static final TypeReference<Map<String, Object>> CUSTOM_FIELDS_TYPE =
        new TypeReference<>() {};

    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final ObjectMapper objectMapper;
    private final ProjectConfigNormalizer normalizer;
    private final ProjectLifecycleService lifecycleService;
    private final CustomFieldValueService customFieldValueService;

    ProjectTemplateConfigDto cloneTemplateForProject(Long projectId, ProjectTemplateConfigDto sourceConfig) {
        ProjectTemplateConfigDto template = normalizer.normalize(projectId, sourceConfig);

        Map<String, String> roleIdMap = new HashMap<>();
        Set<String> usedRoleIds = new HashSet<>();
        List<CustomRoleDto> roles = new ArrayList<>();
        for (int index = 0; index < template.roles().size(); index++) {
            CustomRoleDto role = template.roles().get(index);
            String id = uniqueGeneratedId(
                "project-" + projectId + "-role-" + slugify(textOr(role.name(), "role-" + (index + 1))),
                usedRoleIds
            );
            roleIdMap.put(role.id(), id);
            roles.add(new CustomRoleDto(
                id,
                projectId,
                role.name(),
                role.permissions() == null ? List.of() : role.permissions()
            ));
        }

        Map<String, String> statusIdMap = new HashMap<>();
        Set<String> usedStatusIds = new HashSet<>();
        List<CustomStatusDto> statuses = new ArrayList<>();
        for (int index = 0; index < template.lifecycle().statuses().size(); index++) {
            CustomStatusDto status = template.lifecycle().statuses().get(index);
            String id = uniqueGeneratedId(
                "project-" + projectId + "-status-" + slugify(textOr(status.name(), "status-" + (index + 1))),
                usedStatusIds
            );
            statusIdMap.put(status.id(), id);
            statuses.add(new CustomStatusDto(
                id,
                projectId,
                status.name(),
                status.displayOrder(),
                status.color(),
                Boolean.TRUE.equals(status.isInitial())
            ));
        }

        Map<String, String> fieldIdMap = new HashMap<>();
        Set<String> usedFieldIds = new HashSet<>();
        List<CustomFieldDefinitionDto> customFields = new ArrayList<>();
        for (int index = 0; index < template.customFields().size(); index++) {
            CustomFieldDefinitionDto field = template.customFields().get(index);
            String id = uniqueGeneratedId(
                "project-" + projectId + "-field-" + slugify(textOr(field.name(), "field-" + (index + 1))),
                usedFieldIds
            );
            fieldIdMap.put(field.id(), id);
            customFields.add(new CustomFieldDefinitionDto(
                id,
                projectId,
                field.name(),
                field.type(),
                field.required(),
                cloneFieldConfigForTemplate(id, field, roleIdMap)
            ));
        }

        Set<String> validFieldIds = new HashSet<>(ProjectConfigDefaults.defaultFieldOrder(customFields));
        List<String> fieldOrder = template.fieldOrder().stream()
            .map(fieldId -> mappedId(fieldIdMap, fieldId))
            .filter(validFieldIds::contains)
            .distinct()
            .toList();

        List<String> boardCardFieldIds = template.boardCardFieldIds().stream()
            .map(fieldId -> mappedId(fieldIdMap, fieldId))
            .filter(fieldId -> !"name".equals(fieldId) && validFieldIds.contains(fieldId))
            .distinct()
            .toList();

        Set<String> usedTransitionIds = new HashSet<>();
        List<ProjectTransitionDto> transitions = new ArrayList<>();
        for (int index = 0; index < template.lifecycle().transitions().size(); index++) {
            ProjectTransitionDto transition = template.lifecycle().transitions().get(index);
            String id = uniqueGeneratedId(
                "project-" + projectId + "-transition-" + slugify(textOr(transition.id(), "transition-" + (index + 1))),
                usedTransitionIds
            );
            transitions.add(new ProjectTransitionDto(
                id,
                mappedId(statusIdMap, transition.fromStatusId()),
                mappedId(statusIdMap, transition.toStatusId()),
                transition.conditions().stream()
                    .map(condition -> cloneConditionForTemplate(condition, roleIdMap, fieldIdMap))
                    .toList()
            ));
        }

        return normalizer.normalize(
            projectId,
            new ProjectTemplateConfigDto(
                roles,
                new LifecycleConfigDto(
                    template.lifecycle().transitionRulesEnabled(),
                    statuses,
                    transitions
                ),
                customFields,
                fieldOrder,
                boardCardFieldIds
            )
        );
    }

    void remapMemberRoles(Long projectId, ProjectConfigDto previousConfig, ProjectTemplateConfigDto nextConfig) {
        Project project = requireProject(projectId);
        CustomRoleDto ownerRole = getRoleByName(nextConfig.roles(), "Owner")
            .or(() -> nextConfig.roles().stream()
                .filter(role -> role.permissions().containsAll(ProjectConfigDefaults.OWNER_CRITICAL_PERMISSIONS))
                .findFirst())
            .or(() -> nextConfig.roles().stream()
                .filter(role -> role.permissions().contains("settings.manage"))
                .findFirst())
            .orElse(nextConfig.roles().getFirst());
        CustomRoleDto managerRole = getRoleByName(nextConfig.roles(), "Admin")
            .or(() -> nextConfig.roles().stream()
                .filter(role -> role.permissions().contains("members.assignRole"))
                .findFirst())
            .orElse(ownerRole);
        CustomRoleDto contributorRole = nextConfig.roles().stream()
            .filter(role -> role.permissions().contains("issue.create")
                && role.permissions().contains("issue.edit")
                && !role.permissions().contains("settings.manage")
                && !role.permissions().contains("members.assignRole"))
            .findFirst()
            .or(() -> nextConfig.roles().stream()
                .filter(role -> role.permissions().contains("issue.edit")
                    && !role.permissions().contains("settings.manage"))
                .findFirst())
            .or(() -> nextConfig.roles().stream()
                .filter(role -> !role.id().equals(ownerRole.id()) && !role.id().equals(managerRole.id()))
                .findFirst())
            .orElse(managerRole);
        CustomRoleDto viewerRole = nextConfig.roles().stream()
            .filter(role -> role.permissions().contains("issue.view")
                && !role.permissions().contains("issue.create")
                && !role.permissions().contains("settings.manage"))
            .findFirst()
            .orElse(contributorRole);

        boolean changed = false;
        for (ProjectMember member : project.getMembers()) {
            CustomRoleDto previousRole = getRoleById(previousConfig.roles(), member.getRoleId()).orElse(null);
            CustomRoleDto mappedByName = previousRole == null
                ? null
                : getRoleByName(nextConfig.roles(), previousRole.name()).orElse(null);
            CustomRoleDto mappedRole = mappedByName;

            if (mappedRole == null) {
                if (member.getUserId().equals(project.getOwnerId())) {
                    mappedRole = ownerRole;
                } else if (previousRole != null
                    && (previousRole.permissions().contains("settings.manage")
                    || previousRole.permissions().contains("members.assignRole"))) {
                    mappedRole = managerRole;
                } else if (previousRole != null
                    && (previousRole.permissions().contains("issue.create")
                    || previousRole.permissions().contains("issue.edit"))) {
                    mappedRole = contributorRole;
                } else {
                    mappedRole = viewerRole;
                }
            }

            if (!mappedRole.id().equals(member.getRoleId())) {
                member.setRoleId(mappedRole.id());
                changed = true;
            }
        }

        if (changed) {
            projectRepository.save(project);
        }
    }

    void remapIssuesToConfig(Long projectId, ProjectConfigDto previousConfig, ProjectTemplateConfigDto nextTemplate) {
        ProjectConfigDto nextConfig = new ProjectConfigDto(
            projectId,
            nextTemplate.roles(),
            nextTemplate.lifecycle(),
            nextTemplate.customFields(),
            nextTemplate.fieldOrder(),
            nextTemplate.boardCardFieldIds(),
            LocalDateTime.now().toString()
        );
        Map<String, String> nextStatusesByName = nextConfig.lifecycle().statuses().stream()
            .collect(Collectors.toMap(
                status -> normalizedName(status.name()),
                CustomStatusDto::id,
                (left, right) -> left
            ));
        String nextInitialStatusId = lifecycleService.getInitialStatusId(nextTemplate);
        Map<String, CustomFieldDefinitionDto> previousFieldsByKey = previousConfig.customFields().stream()
            .collect(Collectors.toMap(
                this::fieldKey,
                field -> field,
                (left, right) -> left
            ));

        List<Issue> issues = issueRepository.findAllActiveByProjectId(projectId);
        boolean changed = false;
        for (Issue issue : issues) {
            String previousStatusName = previousConfig.lifecycle().statuses().stream()
                .filter(status -> status.id().equals(issue.getStatus()))
                .map(CustomStatusDto::name)
                .findFirst()
                .orElse(null);
            issue.setStatus(
                previousStatusName == null
                    ? nextInitialStatusId
                    : nextStatusesByName.getOrDefault(normalizedName(previousStatusName), nextInitialStatusId)
            );

            Map<String, Object> previousValues = readIssueCustomFields(issue);
            Map<String, Object> nextValues = new LinkedHashMap<>();
            for (CustomFieldDefinitionDto nextField : nextConfig.customFields()) {
                CustomFieldDefinitionDto previousField = previousFieldsByKey.get(fieldKey(nextField));
                if (previousField == null) {
                    continue;
                }

                Object previousValue = previousValues.get(previousField.id());
                if (customFieldValueService.isBlankValue(previousValue)) {
                    continue;
                }

                try {
                    nextValues.put(
                        nextField.id(),
                        customFieldValueService.sanitizeCustomFieldValue(projectId, nextField, previousValue, issue.getId())
                    );
                } catch (IllegalArgumentException ignored) {
                    // Drop carried values that no longer fit the target field config.
                }
            }
            issue.setCustomFieldsJson(writeIssueCustomFields(nextValues));
            changed = true;
        }

        if (changed) {
            issueRepository.saveAll(issues);
        }
    }

    private Map<String, Object> cloneFieldConfigForTemplate(
        String fieldId,
        CustomFieldDefinitionDto field,
        Map<String, String> roleIdMap
    ) {
        Map<String, Object> config = new LinkedHashMap<>();
        Map<String, Object> source = field.config() == null ? Map.of() : field.config();

        switch (field.type()) {
            case "text" -> {
                if (source.get("maxLength") != null) {
                    config.put("maxLength", source.get("maxLength"));
                }
            }
            case "number" -> {
                if (source.get("min") != null) {
                    config.put("min", source.get("min"));
                }
                if (source.get("max") != null) {
                    config.put("max", source.get("max"));
                }
                if (Boolean.TRUE.equals(source.get("isInteger"))) {
                    config.put("isInteger", true);
                }
            }
            case "user_reference" -> config.put(
                "allowedRoleIds",
                customFieldValueService.allowedRoleIds(field).stream()
                    .map(roleId -> mappedId(roleIdMap, roleId))
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList()
            );
            case "enum" -> {
                Set<String> usedOptionIds = new HashSet<>();
                List<Map<String, Object>> options = new ArrayList<>();
                List<Map<String, Object>> sourceOptions = customFieldValueService.enumOptions(field);
                for (int index = 0; index < sourceOptions.size(); index++) {
                    Map<String, Object> option = sourceOptions.get(index);
                    String label = optionText(option.get("label"), option.get("id"), "Option " + (index + 1));
                    String id = uniqueGeneratedId(
                        fieldId + "-option-" + slugify(textOr(label, "option-" + (index + 1))),
                        usedOptionIds
                    );
                    options.add(Map.of(
                        "id", id,
                        "label", textOr(label, id),
                        "color", optionText(option.get("color"), null, "#64748b")
                    ));
                }
                config.put("options", options);
            }
            default -> {
            }
        }

        return config;
    }

    private TransitionConditionDto cloneConditionForTemplate(
        TransitionConditionDto condition,
        Map<String, String> roleIdMap,
        Map<String, String> fieldIdMap
    ) {
        if ("role".equals(condition.type())) {
            return new TransitionConditionDto("role", mappedId(roleIdMap, condition.roleId()), null);
        }
        if ("field_user_reference".equals(condition.type())) {
            return new TransitionConditionDto(
                "field_user_reference",
                null,
                mappedId(fieldIdMap, condition.customFieldId())
            );
        }

        return new TransitionConditionDto(condition.type(), condition.roleId(), condition.customFieldId());
    }

    private Optional<CustomRoleDto> getRoleById(List<CustomRoleDto> roles, String roleId) {
        return roles.stream()
            .filter(role -> role.id().equals(roleId))
            .findFirst();
    }

    private Optional<CustomRoleDto> getRoleByName(List<CustomRoleDto> roles, String name) {
        return roles.stream()
            .filter(role -> normalizedName(role.name()).equals(normalizedName(name)))
            .findFirst();
    }

    private Map<String, Object> readIssueCustomFields(Issue issue) {
        if (issue.getCustomFieldsJson() == null || issue.getCustomFieldsJson().isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(issue.getCustomFieldsJson(), CUSTOM_FIELDS_TYPE);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Issue custom fields are not readable", ex);
        }
    }

    private String writeIssueCustomFields(Map<String, Object> customFields) {
        if (customFields == null || customFields.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(customFields);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Issue custom fields are not writable", ex);
        }
    }

    private String fieldKey(CustomFieldDefinitionDto field) {
        return field.type() + ":" + normalizedName(field.name());
    }

    private String mappedId(Map<String, String> idMap, String id) {
        if (id == null) {
            return null;
        }
        return idMap.getOrDefault(id, id);
    }

    private String uniqueGeneratedId(String candidate, Set<String> usedIds) {
        String base = textOr(candidate, "item");
        String id = base;
        int suffix = 2;
        while (!usedIds.add(id)) {
            id = base + "-" + suffix;
            suffix++;
        }
        return id;
    }

    private String slugify(String value) {
        String slug = value == null
            ? ""
            : value.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        return slug.isBlank() ? "item" : slug;
    }

    private String normalizedName(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String optionText(Object primary, Object secondary, String fallback) {
        Object value = primary != null ? primary : secondary;
        if (value == null) {
            return fallback;
        }

        String text = String.valueOf(value);
        if (text.isBlank() || "null".equalsIgnoreCase(text)) {
            return fallback;
        }

        return text;
    }

    private Project requireProject(Long projectId) {
        return projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    private String textOr(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback == null || fallback.isBlank() ? "item" : fallback;
        }

        return value;
    }
}
