package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.*;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomFieldDefinitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectIssueConfigApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectLifecyclePolicyApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectQueryApi;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class IssueService implements IssueCommandApi, IssueQueryApi {

    private final IssueRepository issueRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ProjectAccessApi projectAccess;
    private final ProjectLifecyclePolicyApi lifecyclePolicyApi;
    private final ProjectQueryApi projectQueryApi;
    private final ProjectIssueConfigApi projectIssueConfigApi;
    private final FileStorageApi fileStorage;
    private final IssueMapper mapper;

    // --- COMMAND API IMPL ---

    @Override
    @Transactional
    public IssueDto createIssue(Long userId, Long projectId, String name, IssueType type,
                            IssuePriority priority, String description,
                            List<Long> assigneeIds, List<AttachmentDto> attachments,
                            java.time.LocalDate dueDate,
                            Map<String, Object> customFields) {
        if (!projectAccess.hasAccess(userId, projectId)) {
            throw new SecurityException("User is not a member of the project");
        }
        if (!projectAccess.hasPermission(userId, projectId, "issue.create")) {
            throw new SecurityException("Insufficient permissions to create issue");
        }

        var projectOpt = projectQueryApi.getProjectById(projectId);
        if (projectOpt.isPresent() && projectOpt.get().archived()) {
            throw new SecurityException("Cannot create issue in archived project");
        }

        List<Long> memberIds = projectQueryApi.getProjectMemberIds(projectId);
        Set<Long> memberIdSet = new HashSet<>(memberIds);
        List<Long> selectedAssigneeIds = (assigneeIds == null || assigneeIds.isEmpty())
            ? List.of(userId)
            : assigneeIds;
        if (!memberIdSet.containsAll(selectedAssigneeIds)) {
            throw new SecurityException("Assignees must be project members");
        }

        Map<String, Object> sanitizedCustomFields = projectIssueConfigApi.sanitizeCustomFields(
            projectId,
            customFields,
            null
        );

        Issue issue = new Issue();
        issue.setProjectId(projectId);
        issue.setAuthorId(userId);
        issue.setName(name);
        issue.setDescription(description);
        issue.setType(type);
        issue.setPriority(priority);
        issue.setAssigneeIds(new ArrayList<>(selectedAssigneeIds));
        issue.setStatus(projectIssueConfigApi.getInitialStatusId(projectId));
        issue.setStartDate(LocalDate.now());
        if (dueDate != null) {
            issue.setDueDate(dueDate);
        }
        issue.setCustomFieldsJson(mapper.writeCustomFields(sanitizedCustomFields));

        check_attachements(attachments, issue);

        Issue saved = issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueCreatedEvent(
            saved.getId(), saved.getProjectId(), saved.getAuthorId(), saved.getName()
        ));

        return mapper.toDto(saved);
    }

    @Override
    @Transactional
    public void updateIssue(Long issueId, Long userId, String name, String description,
        IssuePriority priority, IssueType type,
        String status,
        List<Long> assigneeIds,
        List<AttachmentDto> newAttachments,
        LocalDate dueDate,
        Map<String, Object> customFields) {

        Issue issue = getIssueIfAllowed(issueId, userId, false);
        if (!projectAccess.hasPermission(userId, issue.getProjectId(), "issue.edit")) {
            throw new SecurityException("Insufficient permissions to edit issue");
        }

        var projectOpt = projectQueryApi.getProjectById(issue.getProjectId());
        if (projectOpt.isPresent() && projectOpt.get().archived()) {
            throw new SecurityException("Cannot update issue in archived project");
        }

        Set<String> newUrls = newAttachments == null ?
            Set.of() :
            newAttachments.stream().map(AttachmentDto::url).collect(Collectors.toSet());

        for (Attachment oldAtt : new ArrayList<>(issue.getAttachments())) {
            if (!newUrls.contains(oldAtt.getFileUrl())) {
                String storedName = extractStoredFileName(oldAtt.getFileUrl());
                fileStorage.deleteFile(storedName);
                issue.getAttachments().remove(oldAtt);
            }
        }

        if (newAttachments != null && !newAttachments.isEmpty()) {
            List<Attachment> newEntities = newAttachments.stream()
                .map(dto -> {
                    Attachment att = new Attachment();
                    String origName = dto.originalFileName();
                    if (origName == null || origName.isBlank()) {
                        origName = extractFileNameFromUrl(dto.url());
                    }
                    att.setOriginalFileName(origName);
                    att.setFileUrl(dto.url());
                    att.setIssue(issue);
                    return att;
                })
                .toList();

            issue.getAttachments().clear();
            issue.getAttachments().addAll(newEntities);
        }

        issue.setName(name);
        issue.setDescription(description);
        issue.setPriority(priority);
        issue.setType(type);

        if (assigneeIds != null) {
            List<Long> memberIds = projectQueryApi.getProjectMemberIds(issue.getProjectId());
            if (!new HashSet<>(memberIds).containsAll(assigneeIds)) {
                throw new SecurityException("Assignees must be project members");
            }
            issue.setAssigneeIds(new ArrayList<>(assigneeIds));
        }

        if (dueDate != null) {
            issue.setDueDate(dueDate);
        }

        if (customFields != null) {
            issue.setCustomFieldsJson(mapper.writeCustomFields(
                projectIssueConfigApi.sanitizeCustomFields(issue.getProjectId(), customFields, issue.getId())
            ));
        }

        if (status != null && !status.equals(issue.getStatus())) {
            if (!projectIssueConfigApi.statusExists(issue.getProjectId(), status)) {
                throw new IllegalArgumentException("Target status does not exist");
            }
            if (!lifecyclePolicyApi.canTransitionIssue(
                userId,
                issue.getProjectId(),
                issue.getStatus(),
                status,
                issue.getAuthorId(),
                issue.getAssigneeIds(),
                mapper.readCustomFields(issue)
            )) {
                throw new SecurityException("Transition denied");
            }
            issue.setStatus(status);
            if ("DONE".equals(status)) {
                issue.setDueDate(LocalDate.now());
            }
        }

        issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueUpdatedEvent(issueId, issue.getProjectId(), userId, "Issue updated"));
    }

    private void check_attachements(List<AttachmentDto> attachments, Issue issue) {
        if (attachments != null) {
            List<Attachment> attachmentEntities = attachments.stream()
                .map(dto -> {
                    Attachment att = new Attachment();
                    String originalFileName = dto.originalFileName();
                    if (originalFileName == null || originalFileName.isBlank()) {
                        originalFileName = extractFileNameFromUrl(dto.url());
                    }
                    att.setOriginalFileName(originalFileName);
                    att.setFileUrl(dto.url());
                    att.setIssue(issue);
                    return att;
                })
                .toList();
            issue.setAttachments(attachmentEntities);
        }
    }

    private String extractFileNameFromUrl(String url) {
        if (url == null) return null;
        int idx = url.lastIndexOf("/");
        return idx >= 0 ? url.substring(idx + 1) : url;
    }

    private String extractStoredFileName(String url) {
        if (url == null || !url.startsWith("/files/")) {
            throw new IllegalArgumentException("Invalid file URL");
        }
        return url.substring("/files/".length());
    }

    @Override
    @Transactional
    public void changeStatus(Long issueId, Long userId, String newStatus) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        if (!projectAccess.hasAccess(userId, issue.getProjectId())) {
            throw new SecurityException("User is not a member of the project");
        }
        if (!projectIssueConfigApi.statusExists(issue.getProjectId(), newStatus)) {
            throw new IllegalArgumentException("Target status does not exist");
        }

        if (!lifecyclePolicyApi.canTransitionIssue(
            userId,
            issue.getProjectId(),
            issue.getStatus(),
            newStatus,
            issue.getAuthorId(),
            issue.getAssigneeIds(),
            mapper.readCustomFields(issue)
        )) {
            throw new SecurityException("Transition denied by lifecycle rules");
        }

        issue.setStatus(newStatus);

        if ("DONE".equals(newStatus)) {
            issue.setDueDate(LocalDate.now());
        }

        issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueUpdatedEvent(
            issue.getId(), issue.getProjectId(), userId, "Status changed to " + newStatus
        ));
    }

    @Override
    @Transactional
    public void moveToTrash(Long issueId, Long userId) {
        Issue issue = getIssueIfAllowed(issueId, userId, false);
        if (!projectAccess.hasPermission(userId, issue.getProjectId(), "issue.remove")) {
            throw new SecurityException("Insufficient permissions to remove issue");
        }

        // Clean up attachments
        for (Attachment att : new ArrayList<>(issue.getAttachments())) {  // Avoid concurrent modification
            String storedFileName = extractStoredFileName(att.getFileUrl());
            fileStorage.deleteFile(storedFileName);
            issue.getAttachments().remove(att);
        }

        issue.setDeletedAt(LocalDateTime.now());
        issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueUpdatedEvent(issueId, issue.getProjectId(), userId, "Moved to trash"));
    }

    @Override
    @Transactional
    public void restoreFromTrash(Long issueId, Long userId) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();
        if (!projectAccess.hasAccess(userId, issue.getProjectId())) {
            throw new SecurityException("User is not a member of the project");
        }
        if (!projectAccess.hasPermission(userId, issue.getProjectId(), "issue.edit")) {
            throw new SecurityException("Insufficient permissions to restore issue");
        }

        issue.setDeletedAt(null);
        issueRepository.save(issue);
    }

    @Override
    @Transactional
    public void removeUserFromProject(Long projectId, Long userId) {
        List<Issue> assigned = issueRepository.findByProjectIdAndAssigneeIdsContaining(projectId, userId);
        for (Issue issue : assigned) {
            List<Long> assignees = issue.getAssigneeIds();
            if (assignees != null && assignees.contains(userId)) {
                assignees = assignees.stream()
                    .filter(id -> !id.equals(userId))
                    .collect(Collectors.toCollection(ArrayList::new));
                issue.setAssigneeIds(assignees);
                if (assignees.isEmpty()) {
                    issue.setStatus(projectIssueConfigApi.getInitialStatusId(projectId));
                }
                issueRepository.save(issue);
            }
        }
    }

    // --- QUERY API IMPL ---

    @Override
    @Transactional(readOnly = true)
    public IssueDto getById(Long userId, Long id) {
        Issue issue = issueRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        requireIssueView(userId, issue.getProjectId());
        return mapper.toDto(issue);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueDto> getBoardIssues(Long userId, Long projectId, IssueFilterDto filter) {
        requireIssueView(userId, projectId);
        ProjectConfigDto config = projectIssueConfigApi.getOrCreateConfig(projectId);
        List<Issue> issues = issueRepository.findAllActiveByProjectId(projectId);
        Stream<Issue> stream = issues.stream();

        if (filter != null) {
            if (filter.types() != null && !filter.types().isEmpty()) {
                stream = stream.filter(i -> filter.types().contains(i.getType()));
            }
            if (filter.priorities() != null && !filter.priorities().isEmpty()) {
                stream = stream.filter(i -> filter.priorities().contains(i.getPriority()));
            }
            if (filter.assigneeId() != null) {
                stream = stream.filter(i ->
                    i.getAssigneeIds() != null && i.getAssigneeIds().contains(filter.assigneeId())
                );
            }
            if (filter.nameQuery() != null && !filter.nameQuery().isBlank()) {
                String q = filter.nameQuery().toLowerCase();
                stream = stream.filter(i -> i.getName().toLowerCase().contains(q));
            }
            if (filter.dateFrom() != null) {
                stream = stream.filter(i -> i.getDueDate() != null && !i.getDueDate().isBefore(filter.dateFrom()));
            }
            if (filter.dateTo() != null) {
                stream = stream.filter(i -> i.getDueDate() != null && !i.getDueDate().isAfter(filter.dateTo()));
            }
            if (filter.customFields() != null && !filter.customFields().isEmpty()) {
                stream = stream.filter(i -> matchesCustomFields(
                    config,
                    mapper.readCustomFields(i),
                    filter.customFields()
                ));
            }
        }
        return stream
            .sorted(Comparator.comparing(Issue::getPriority))
            .map(mapper::toDto)
            .toList();
    }

    private boolean matchesCustomFields(
        ProjectConfigDto config,
        Map<String, Object> issueCustomFields,
        Map<String, Object> expectedCustomFields
    ) {
        Map<String, CustomFieldDefinitionDto> fieldsById = config.customFields().stream()
            .collect(Collectors.toMap(CustomFieldDefinitionDto::id, field -> field));

        return expectedCustomFields.entrySet().stream()
            .filter(entry -> entry.getValue() != null && !"".equals(entry.getValue()))
            .allMatch(entry -> {
                Object actual = issueCustomFields.get(entry.getKey());
                Object expected = entry.getValue();
                CustomFieldDefinitionDto field = fieldsById.get(entry.getKey());
                if ("checkbox".equals(field == null ? null : field.type())) {
                    return Boolean.valueOf(String.valueOf(actual == null ? false : actual))
                        .equals(Boolean.valueOf(String.valueOf(expected)));
                }
                if (actual == null) {
                    return false;
                }
                if ("enum".equals(field == null ? null : field.type())) {
                    return actual.toString().equals(expected.toString());
                }
                if (actual instanceof Number actualNumber && expected instanceof Number expectedNumber) {
                    return Double.compare(actualNumber.doubleValue(), expectedNumber.doubleValue()) == 0;
                }
                if ("number".equals(field == null ? null : field.type())) {
                    try {
                        return Double.compare(
                            Double.parseDouble(actual.toString()),
                            Double.parseDouble(expected.toString())
                        ) == 0;
                    } catch (NumberFormatException ex) {
                        return false;
                    }
                }
                return actual.toString().toLowerCase().contains(expected.toString().toLowerCase());
            });
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueDto> getTrashBin(Long userId, Long projectId) {
        requireIssueView(userId, projectId);
        return issueRepository.findDeletedByProjectId(projectId).stream()
            .map(mapper::toDto)
            .toList();
    }

    @Override
    @Transactional
    public void removeAttachment(Long issueId, Long userId, String attachmentUrl) {
        Issue issue = getIssueIfAllowed(issueId, userId, true);
        Attachment toRemove = issue.getAttachments().stream()
            .filter(att -> att.getFileUrl().equals(attachmentUrl))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        String storedFileName = extractStoredFileName(attachmentUrl);
        fileStorage.deleteFile(storedFileName);
        issue.getAttachments().remove(toRemove);
        issueRepository.save(issue);
    }

    private Issue getIssueIfAllowed(Long issueId, Long userId, boolean checkAssignee) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        if (!projectAccess.hasAccess(userId, issue.getProjectId())) {
            throw new SecurityException("User is not a member of the project");
        }
        if (checkAssignee) {
            String role = projectAccess.getUserRole(userId, issue.getProjectId()).orElse("");
            boolean isAssignee = issue.getAssigneeIds() != null && issue.getAssigneeIds().contains(userId);
            boolean isAuthor = issue.getAuthorId() != null && issue.getAuthorId().equals(userId);
            if (!isAssignee && !isAuthor && !"OWNER".equals(role) && !"ADMIN".equals(role)) {
                throw new SecurityException("Access denied");
            }
        }
        return issue;
    }

    private void requireIssueView(Long userId, Long projectId) {
        if (!projectAccess.hasAccess(userId, projectId)) {
            throw new SecurityException("User is not a member of the project");
        }
        if (!projectAccess.hasPermission(userId, projectId, "issue.view")) {
            throw new SecurityException("Insufficient permissions to view issues");
        }
    }
}

