package issue.tracking.system.issuetrackingsystem.projects.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Collection;
import java.util.List;
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
    private final ObjectMapper objectMapper;

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

        ProjectConfigEntity entity = configRepository.findById(projectId)
            .orElseGet(() -> new ProjectConfigEntity(projectId, ""));
        entity.setConfigJson(write(template));
        entity.setUpdatedAt(LocalDateTime.now());
        ProjectConfigEntity saved = configRepository.save(entity);
        alignMemberRoles(projectId, template.roles());
        return toConfigDto(saved);
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
        ProjectConfigDto source = getOrCreateConfig(sourceProjectId);
        ProjectTemplateConfigDto targetTemplate = normalizeTemplate(
            targetProjectId,
            new ProjectTemplateConfigDto(
                source.roles(),
                source.lifecycle(),
                source.customFields(),
                source.fieldOrder(),
                source.boardCardFieldIds()
            )
        );

        ProjectConfigEntity entity = configRepository.findById(targetProjectId)
            .orElseGet(() -> new ProjectConfigEntity(targetProjectId, ""));
        entity.setConfigJson(write(targetTemplate));
        entity.setUpdatedAt(LocalDateTime.now());
        ProjectConfigEntity saved = configRepository.save(entity);

        alignMemberRoles(targetProjectId, targetTemplate.roles());
        return toConfigDto(saved);
    }

    @Transactional
    public Optional<CustomRoleDto> getUserRole(Long projectId, Long userId) {
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
        if (!Boolean.TRUE.equals(config.lifecycle().transitionRulesEnabled())) {
            return true;
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

        String currentRoleId = requireProject(projectId).getMembers().stream()
            .filter(member -> member.getUserId().equals(userId))
            .map(ProjectMember::getRoleId)
            .findFirst()
            .orElse(null);

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

    private Optional<CustomRoleDto> getRoleById(ProjectConfigDto config, String roleId) {
        return config.roles().stream()
            .filter(role -> role.id().equals(roleId))
            .findFirst();
    }

    private void alignMemberRoles(Long projectId, List<CustomRoleDto> roles) {
        Project project = requireProject(projectId);
        Set<String> roleIds = roles.stream()
            .map(CustomRoleDto::id)
            .collect(java.util.stream.Collectors.toSet());
        String fallbackRoleId = roles.stream()
            .filter(role -> role.permissions().contains("settings.manage"))
            .map(CustomRoleDto::id)
            .findFirst()
            .orElse(roles.getFirst().id());

        boolean changed = false;
        for (ProjectMember member : project.getMembers()) {
            if (member.getUserId().equals(project.getOwnerId()) &&
                !ProjectConfigDefaults.OWNER.equals(member.getRoleId())) {
                member.setRoleId(ProjectConfigDefaults.OWNER);
                changed = true;
                continue;
            }
            if (!roleIds.contains(member.getRoleId())) {
                member.setRoleId(fallbackRoleId);
                changed = true;
            }
        }

        if (changed) {
            projectRepository.save(project);
        }
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

        Optional<CustomRoleDto> configuredOwnerRole = roles.stream()
            .filter(role -> ProjectConfigDefaults.OWNER.equals(role.id()))
            .findFirst();
        CustomRoleDto ownerRole = ProjectConfigDefaults.ownerRole(
            projectId,
            configuredOwnerRole.map(CustomRoleDto::name).orElse("Owner")
        );
        roles = configuredOwnerRole.isPresent()
            ? roles.stream()
                .map(role -> ProjectConfigDefaults.OWNER.equals(role.id()) ? ownerRole : role)
                .toList()
            : java.util.stream.Stream.concat(roles.stream(), java.util.stream.Stream.of(ownerRole))
                .toList();

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
            .filter(items -> !items.isEmpty())
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
                field.config() == null ? Map.of() : field.config()
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

        List<String> normalizedFieldOrder = java.util.stream.Stream
            .concat(fieldOrder.stream(), missing.stream())
            .toList();
        Set<String> configurableBoardFieldIds = normalizedFieldOrder.stream()
            .filter(fieldId -> !"name".equals(fieldId))
            .collect(java.util.stream.Collectors.toSet());
        List<String> fallbackBoardCardFieldIds = ProjectConfigDefaults
            .defaultBoardCardFieldIds(customFields);
        List<String> boardCardFieldIds = Optional.ofNullable(config.boardCardFieldIds())
            .orElse(fallbackBoardCardFieldIds)
            .stream()
            .filter(configurableBoardFieldIds::contains)
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
            normalizedFieldOrder,
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
