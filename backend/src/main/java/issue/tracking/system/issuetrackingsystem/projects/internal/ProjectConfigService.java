package issue.tracking.system.issuetrackingsystem.projects.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomFieldDefinitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomStatusDto;
import issue.tracking.system.issuetrackingsystem.projects.api.LifecycleConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTransitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.TransitionConditionDto;
import issue.tracking.system.issuetrackingsystem.issue.internal.IssueRepository;
import issue.tracking.system.issuetrackingsystem.users.api.UserQueryApi;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectConfigService {

    private final ProjectConfigRepository configRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final UserQueryApi userQueryApi;
    private final ObjectMapper objectMapper;
    private static final TypeReference<Map<String, Object>> CUSTOM_FIELDS_TYPE =
        new TypeReference<>() {};

    @Transactional
    public ProjectConfigDto createDefaultConfig(Long projectId) {
        Project project = requireProject(projectId);
        ProjectConfigEntity entity = newEntity(project.getId(), ProjectConfigDefaults.defaultTemplate(project.getId()));
        ProjectConfigEntity saved = configRepository.save(entity);
        return toConfigDto(saved);
    }

    @Transactional
    public ProjectConfigDto getOrCreateConfig(Long projectId) {
        requireProject(projectId);
        ProjectConfigEntity entity = configRepository.findById(projectId)
            .orElseGet(() -> configRepository.save(
                newEntity(projectId, ProjectConfigDefaults.defaultTemplate(projectId))
            ));

        return toConfigDto(entity);
    }

    @Transactional
    public ProjectConfigDto saveConfig(Long projectId, ProjectConfigDto config) {
        requireProject(projectId);
        ProjectTemplateConfigDto template = normalizeTemplate(
            projectId,
            new ProjectTemplateConfigDto(
                config.roles(),
                config.lifecycle(),
                config.customFields(),
                config.fieldOrder(),
                config.boardCardFieldIds()
            )
        );
        validateTemplate(projectId, template);

        ProjectConfigEntity entity = configRepository.findById(projectId)
            .orElseGet(() -> new ProjectConfigEntity(projectId, ""));
        entity.setConfigJson(write(template));
        entity.setUpdatedAt(LocalDateTime.now());
        return toConfigDto(configRepository.save(entity));
    }

    @Transactional
    public ProjectTemplateDto exportTemplate(Long projectId) {
        Project project = requireProject(projectId);
        ProjectConfigDto config = getOrCreateConfig(projectId);
        return new ProjectTemplateDto(
            project.getId(),
            project.getName(),
            new ProjectTemplateConfigDto(
                config.roles(),
                config.lifecycle(),
                config.customFields(),
                config.fieldOrder(),
                config.boardCardFieldIds()
            )
        );
    }

    @Transactional
    public ProjectConfigDto applyTemplate(Long targetProjectId, Long sourceProjectId) {
        requireProject(targetProjectId);
        requireProject(sourceProjectId);
        ProjectConfigDto previousConfig = getOrCreateConfig(targetProjectId);
        ProjectConfigDto source = getOrCreateConfig(sourceProjectId);
        ProjectTemplateConfigDto targetTemplate = cloneTemplateForProject(
            targetProjectId,
            new ProjectTemplateConfigDto(
                source.roles(),
                source.lifecycle(),
                source.customFields(),
                source.fieldOrder(),
                source.boardCardFieldIds()
            )
        );
        remapMemberRoles(targetProjectId, previousConfig, targetTemplate);
        remapIssuesToConfig(targetProjectId, previousConfig, targetTemplate);
        validateTemplate(targetProjectId, targetTemplate);

        ProjectConfigEntity entity = configRepository.findById(targetProjectId)
            .orElseGet(() -> new ProjectConfigEntity(targetProjectId, ""));
        entity.setConfigJson(write(targetTemplate));
        entity.setUpdatedAt(LocalDateTime.now());
        ProjectConfigEntity saved = configRepository.save(entity);

        return toConfigDto(saved);
    }

    @Transactional
    public ProjectConfigDto importTemplate(Long targetProjectId, ProjectTemplateConfigDto sourceConfig) {
        requireProject(targetProjectId);
        if (sourceConfig == null) {
            throw new IllegalArgumentException("Template config is required");
        }

        ProjectConfigDto previousConfig = getOrCreateConfig(targetProjectId);
        ProjectTemplateConfigDto targetTemplate = cloneTemplateForProject(targetProjectId, sourceConfig);
        remapMemberRoles(targetProjectId, previousConfig, targetTemplate);
        remapIssuesToConfig(targetProjectId, previousConfig, targetTemplate);
        validateTemplate(targetProjectId, targetTemplate);

        ProjectConfigEntity entity = configRepository.findById(targetProjectId)
            .orElseGet(() -> new ProjectConfigEntity(targetProjectId, ""));
        entity.setConfigJson(write(targetTemplate));
        entity.setUpdatedAt(LocalDateTime.now());
        ProjectConfigEntity saved = configRepository.save(entity);

        return toConfigDto(saved);
    }

    @Transactional
    public Optional<CustomRoleDto> getUserRole(Long projectId, Long userId) {
        if (userQueryApi.isGlobalAdmin(userId)) {
            requireProject(projectId);
            return Optional.of(ProjectConfigDefaults.globalAdminRole(projectId));
        }

        Project project = requireProject(projectId);
        String roleId = project.getMembers().stream()
            .filter(member -> member.getUserId().equals(userId))
            .map(ProjectMember::getRoleId)
            .findFirst()
            .orElse(null);

        if (roleId == null) {
            return Optional.empty();
        }

        ProjectConfigDto config = getOrCreateConfig(projectId);
        return getRoleById(config, roleId)
            .or(() -> Optional.of(new CustomRoleDto(roleId, projectId, roleId, List.of())));
    }

    @Transactional
    public boolean hasPermission(Long projectId, Long userId, String permission) {
        if (userQueryApi.isGlobalAdmin(userId)) {
            requireProject(projectId);
            return true;
        }

        return getUserRole(projectId, userId)
            .map(role -> role.permissions().contains(permission))
            .orElse(false);
    }

    @Transactional
    public boolean hasRole(Long projectId, String roleId) {
        ProjectConfigDto config = getOrCreateConfig(projectId);
        return config.roles().stream().anyMatch(role -> role.id().equals(roleId));
    }

    @Transactional
    public Optional<CustomRoleDto> getRoleById(Long projectId, String roleId) {
        return getRoleById(getOrCreateConfig(projectId), roleId);
    }

    @Transactional
    public boolean canTransitionIssue(
        Long projectId,
        Long userId,
        String fromStatusId,
        String toStatusId,
        Long authorId,
        List<Long> assigneeIds,
        Map<String, Object> customFields
    ) {
        ProjectConfigDto config = getOrCreateConfig(projectId);
        if (userQueryApi.isGlobalAdmin(userId)) {
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

        Optional<CustomRoleDto> currentRole = getUserRole(projectId, userId);
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

    @Transactional(readOnly = true)
    public String getInitialStatusId(Long projectId) {
        ProjectConfigDto config = getOrCreateConfig(projectId);
        return config.lifecycle().statuses().stream()
            .filter(status -> Boolean.TRUE.equals(status.isInitial()))
            .findFirst()
            .or(() -> config.lifecycle().statuses().stream()
                .sorted(java.util.Comparator.comparing(CustomStatusDto::displayOrder))
                .findFirst())
            .map(CustomStatusDto::id)
            .orElseThrow(() -> new IllegalArgumentException("Project has no initial status"));
    }

    @Transactional(readOnly = true)
    public boolean statusExists(Long projectId, String statusId) {
        return statusExists(getOrCreateConfig(projectId), statusId);
    }

    @Transactional(readOnly = true)
    public Optional<CustomFieldDefinitionDto> getCustomField(Long projectId, String fieldId) {
        return getOrCreateConfig(projectId).customFields().stream()
            .filter(field -> field.id().equals(fieldId))
            .findFirst();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> sanitizeCustomFields(
        Long projectId,
        Map<String, Object> values,
        Long issueId
    ) {
        ProjectConfigDto config = getOrCreateConfig(projectId);
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

    private Optional<CustomRoleDto> getRoleById(ProjectConfigDto config, String roleId) {
        return config.roles().stream()
            .filter(role -> role.id().equals(roleId))
            .findFirst();
    }

    private void validateTemplate(Long projectId, ProjectTemplateConfigDto config) {
        Project project = requireProject(projectId);

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

        Set<String> existingActiveStatuses = issueRepository.findAllActiveByProjectId(projectId).stream()
            .map(issue -> issue.getStatus())
            .collect(java.util.stream.Collectors.toSet());
        if (!statusIds.containsAll(existingActiveStatuses)) {
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
            .collect(java.util.stream.Collectors.toMap(CustomFieldDefinitionDto::id, field -> field));

        for (ProjectTransitionDto transition : config.lifecycle().transitions()) {
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
            .collect(java.util.stream.Collectors.toSet());

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

    private ProjectTemplateConfigDto cloneTemplateForProject(Long projectId, ProjectTemplateConfigDto sourceConfig) {
        ProjectTemplateConfigDto template = normalizeTemplate(projectId, sourceConfig);

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

        return normalizeTemplate(
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
                allowedRoleIds(field).stream()
                    .map(roleId -> mappedId(roleIdMap, roleId))
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList()
            );
            case "enum" -> {
                Set<String> usedOptionIds = new HashSet<>();
                List<Map<String, Object>> options = new ArrayList<>();
                List<Map<String, Object>> sourceOptions = enumOptions(field);
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

    private void remapMemberRoles(Long projectId, ProjectConfigDto previousConfig, ProjectTemplateConfigDto nextConfig) {
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

    private void remapIssuesToConfig(Long projectId, ProjectConfigDto previousConfig, ProjectTemplateConfigDto nextTemplate) {
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
            .collect(java.util.stream.Collectors.toMap(
                status -> normalizedName(status.name()),
                CustomStatusDto::id,
                (left, right) -> left
            ));
        String nextInitialStatusId = getInitialStatusId(nextTemplate);
        Map<String, CustomFieldDefinitionDto> previousFieldsByKey = previousConfig.customFields().stream()
            .collect(java.util.stream.Collectors.toMap(
                this::fieldKey,
                field -> field,
                (left, right) -> left
            ));

        List<issue.tracking.system.issuetrackingsystem.issue.internal.Issue> issues =
            issueRepository.findAllActiveByProjectId(projectId);
        boolean changed = false;
        for (issue.tracking.system.issuetrackingsystem.issue.internal.Issue issue : issues) {
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
                if (isBlankValue(previousValue)) {
                    continue;
                }

                try {
                    nextValues.put(
                        nextField.id(),
                        sanitizeCustomFieldValue(projectId, nextField, previousValue, issue.getId())
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

    private String getInitialStatusId(ProjectTemplateConfigDto config) {
        return config.lifecycle().statuses().stream()
            .filter(status -> Boolean.TRUE.equals(status.isInitial()))
            .findFirst()
            .or(() -> config.lifecycle().statuses().stream()
                .sorted(java.util.Comparator.comparing(CustomStatusDto::displayOrder))
                .findFirst())
            .map(CustomStatusDto::id)
            .orElseThrow(() -> new IllegalArgumentException("Project has no initial status"));
    }

    private Map<String, Object> readIssueCustomFields(
        issue.tracking.system.issuetrackingsystem.issue.internal.Issue issue
    ) {
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

    private ProjectConfigEntity newEntity(Long projectId, ProjectTemplateConfigDto config) {
        return new ProjectConfigEntity(projectId, write(normalizeTemplate(projectId, config)));
    }

    private ProjectConfigDto toConfigDto(ProjectConfigEntity entity) {
        ProjectTemplateConfigDto template = normalizeTemplate(
            entity.getProjectId(),
            read(entity.getConfigJson())
        );

        return new ProjectConfigDto(
            entity.getProjectId(),
            template.roles(),
            template.lifecycle(),
            template.customFields(),
            template.fieldOrder(),
            template.boardCardFieldIds(),
            entity.getUpdatedAt().toString()
        );
    }

    private ProjectTemplateConfigDto normalizeTemplate(Long projectId, ProjectTemplateConfigDto config) {
        ProjectTemplateConfigDto fallback = ProjectConfigDefaults.defaultTemplate(projectId);

        List<CustomRoleDto> roles = Optional.ofNullable(config.roles())
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

        List<CustomStatusDto> statuses = Optional.ofNullable(config.lifecycle())
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
        List<ProjectTransitionDto> transitions = Optional.ofNullable(config.lifecycle())
            .map(LifecycleConfigDto::transitions)
            .orElseGet(() -> ProjectConfigDefaults.defaultTransitions(normalizedRoles))
            .stream()
            .filter(Objects::nonNull)
            .map(transition -> normalizeTransition(transition, normalizedRoles))
            .toList();

        List<CustomFieldDefinitionDto> customFields = Optional.ofNullable(config.customFields())
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
        List<String> fieldOrder = Optional.ofNullable(config.fieldOrder())
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
        List<String> boardCardFieldIds = Optional.ofNullable(config.boardCardFieldIds())
            .filter(items -> !items.isEmpty())
            .orElse(fallbackBoardCardFieldIds)
            .stream()
            .filter(validBoardCardFieldIds::contains)
            .distinct()
            .toList();

        return new ProjectTemplateConfigDto(
            roles,
            new LifecycleConfigDto(
                Optional.ofNullable(config.lifecycle())
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
            textOr(
                transition.id(),
                transition.fromStatusId() + "__" + transition.toStatusId()
            ),
            transition.fromStatusId(),
            transition.toStatusId(),
            conditions
        );
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

    @SuppressWarnings("unchecked")
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

    private Object sanitizeCustomFieldValue(
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
        Project project = requireProject(projectId);
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

    @SuppressWarnings("unchecked")
    private List<String> allowedRoleIds(CustomFieldDefinitionDto field) {
        Object allowedRoleIds = field.config().get("allowedRoleIds");
        if (!(allowedRoleIds instanceof Collection<?> collection)) {
            return List.of();
        }
        return collection.stream().map(String::valueOf).toList();
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

    private boolean statusExists(ProjectConfigDto config, String statusId) {
        if (statusId == null || statusId.isBlank()) {
            return false;
        }
        return config.lifecycle().statuses().stream()
            .anyMatch(status -> status.id().equals(statusId));
    }

    private boolean isBlankValue(Object value) {
        return value == null || (value instanceof String text && text.isBlank());
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

    private ProjectTemplateConfigDto read(String json) {
        try {
            return objectMapper.readValue(json, ProjectTemplateConfigDto.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Project config is not readable", ex);
        }
    }

    private String write(ProjectTemplateConfigDto config) {
        try {
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Project config is not writable", ex);
        }
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
