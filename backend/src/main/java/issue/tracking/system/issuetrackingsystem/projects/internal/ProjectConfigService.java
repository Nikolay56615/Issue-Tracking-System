package issue.tracking.system.issuetrackingsystem.projects.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import issue.tracking.system.issuetrackingsystem.issue.internal.IssueRepository;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigCommandApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigQueryApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectIssueConfigApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateDto;
import issue.tracking.system.issuetrackingsystem.users.api.UserQueryApi;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectConfigService implements ProjectConfigCommandApi, ProjectConfigQueryApi, ProjectIssueConfigApi {

    private final ProjectConfigRepository configRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final UserQueryApi userQueryApi;
    private final ObjectMapper objectMapper;
    private final ProjectConfigNormalizer normalizer;
    private final ProjectConfigValidator validator;
    private final ProjectLifecycleService lifecycleService;
    private final CustomFieldValueService customFieldValueService;
    private final ProjectTemplateService templateService;

    @Transactional
    public ProjectConfigDto createDefaultConfig(Long projectId) {
        Project project = requireProject(projectId);
        ProjectConfigEntity entity = newEntity(project.getId(), ProjectConfigDefaults.defaultTemplate(project.getId()));
        ProjectConfigEntity saved = configRepository.save(entity);
        return toConfigDto(saved);
    }

    @Override
    @Transactional
    public ProjectConfigDto getOrCreateConfig(Long projectId) {
        requireProject(projectId);
        ProjectConfigEntity entity = configRepository.findById(projectId)
            .orElseGet(() -> configRepository.save(
                newEntity(projectId, ProjectConfigDefaults.defaultTemplate(projectId))
            ));

        return toConfigDto(entity);
    }

    @Override
    @Transactional
    public ProjectConfigDto saveConfig(Long projectId, ProjectConfigDto config) {
        requireProject(projectId);
        ProjectTemplateConfigDto template = normalizer.normalize(
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

    @Override
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

    @Override
    @Transactional
    public ProjectConfigDto applyTemplate(Long targetProjectId, Long sourceProjectId) {
        requireProject(targetProjectId);
        requireProject(sourceProjectId);
        ProjectConfigDto previousConfig = getOrCreateConfig(targetProjectId);
        ProjectConfigDto source = getOrCreateConfig(sourceProjectId);
        ProjectTemplateConfigDto targetTemplate = templateService.cloneTemplateForProject(
            targetProjectId,
            new ProjectTemplateConfigDto(
                source.roles(),
                source.lifecycle(),
                source.customFields(),
                source.fieldOrder(),
                source.boardCardFieldIds()
            )
        );
        templateService.remapMemberRoles(targetProjectId, previousConfig, targetTemplate);
        templateService.remapIssuesToConfig(targetProjectId, previousConfig, targetTemplate);
        validateTemplate(targetProjectId, targetTemplate);

        return saveTemplate(targetProjectId, targetTemplate);
    }

    @Override
    @Transactional
    public ProjectConfigDto importTemplate(Long targetProjectId, ProjectTemplateConfigDto sourceConfig) {
        requireProject(targetProjectId);
        if (sourceConfig == null) {
            throw new IllegalArgumentException("Template config is required");
        }

        ProjectConfigDto previousConfig = getOrCreateConfig(targetProjectId);
        ProjectTemplateConfigDto targetTemplate = templateService.cloneTemplateForProject(targetProjectId, sourceConfig);
        templateService.remapMemberRoles(targetProjectId, previousConfig, targetTemplate);
        templateService.remapIssuesToConfig(targetProjectId, previousConfig, targetTemplate);
        validateTemplate(targetProjectId, targetTemplate);

        return saveTemplate(targetProjectId, targetTemplate);
    }

    @Override
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

    @Override
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

    @Override
    @Transactional
    public boolean hasRole(Long projectId, String roleId) {
        ProjectConfigDto config = getOrCreateConfig(projectId);
        return config.roles().stream().anyMatch(role -> role.id().equals(roleId));
    }

    @Override
    @Transactional
    public Optional<CustomRoleDto> getRoleById(Long projectId, String roleId) {
        return getRoleById(getOrCreateConfig(projectId), roleId);
    }

    @Transactional
    boolean canTransitionIssue(
        Long projectId,
        Long userId,
        String fromStatusId,
        String toStatusId,
        Long authorId,
        List<Long> assigneeIds,
        Map<String, Object> customFields
    ) {
        ProjectConfigDto config = getOrCreateConfig(projectId);
        boolean globalAdmin = userQueryApi.isGlobalAdmin(userId);
        Optional<CustomRoleDto> currentRole = globalAdmin ? Optional.empty() : getUserRole(projectId, userId);
        return lifecycleService.canTransitionIssue(
            config,
            currentRole,
            globalAdmin,
            userId,
            fromStatusId,
            toStatusId,
            authorId,
            assigneeIds,
            customFields
        );
    }

    @Override
    @Transactional(readOnly = true)
    public String getInitialStatusId(Long projectId) {
        return lifecycleService.getInitialStatusId(getOrCreateConfig(projectId));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean statusExists(Long projectId, String statusId) {
        return lifecycleService.statusExists(getOrCreateConfig(projectId), statusId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> sanitizeCustomFields(
        Long projectId,
        Map<String, Object> values,
        Long issueId
    ) {
        return customFieldValueService.sanitizeCustomFields(
            getOrCreateConfig(projectId),
            projectId,
            values,
            issueId
        );
    }

    private ProjectConfigDto saveTemplate(Long projectId, ProjectTemplateConfigDto template) {
        ProjectConfigEntity entity = configRepository.findById(projectId)
            .orElseGet(() -> new ProjectConfigEntity(projectId, ""));
        entity.setConfigJson(write(template));
        entity.setUpdatedAt(LocalDateTime.now());
        return toConfigDto(configRepository.save(entity));
    }

    private void validateTemplate(Long projectId, ProjectTemplateConfigDto template) {
        Project project = requireProject(projectId);
        Set<String> activeIssueStatusIds = issueRepository.findAllActiveByProjectId(projectId).stream()
            .map(issue -> issue.getStatus())
            .collect(Collectors.toSet());
        validator.validate(project, activeIssueStatusIds, template);
    }

    private Optional<CustomRoleDto> getRoleById(ProjectConfigDto config, String roleId) {
        return config.roles().stream()
            .filter(role -> role.id().equals(roleId))
            .findFirst();
    }

    private ProjectConfigEntity newEntity(Long projectId, ProjectTemplateConfigDto config) {
        return new ProjectConfigEntity(projectId, write(normalizer.normalize(projectId, config)));
    }

    private ProjectConfigDto toConfigDto(ProjectConfigEntity entity) {
        ProjectTemplateConfigDto template = normalizer.normalize(
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
}
