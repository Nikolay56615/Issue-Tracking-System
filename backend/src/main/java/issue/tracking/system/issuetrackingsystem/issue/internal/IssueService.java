package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.*;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectQueryApi;
import java.util.HashSet;
import java.util.Set;
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
    private final ProjectQueryApi projectQueryApi;
    private final LifecycleEngine lifecycle;
    private final IssueMapper mapper;

    // --- COMMAND API IMPL ---

    @Override
    @Transactional
    public IssueDto createIssue(Long userId, Long projectId, String name, IssueType type,
                            IssuePriority priority, String description,
                            List<Long> assigneeIds, List<String> attachmentFileNames,
                            java.time.LocalDate dueDate) {
        if (!projectAccess.hasAccess(userId, projectId)) {
            throw new SecurityException("User is not a member of the project");
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

        Issue issue = new Issue();
        issue.setProjectId(projectId);
        issue.setAuthorId(userId);
        issue.setName(name);
        issue.setDescription(description);
        issue.setType(type);
        issue.setPriority(priority);
        issue.setAssigneeIds(selectedAssigneeIds);
        issue.setStatus(IssueStatus.BACKLOG);
        issue.setStartDate(LocalDate.now());
        if (dueDate != null) {
            issue.setDueDate(dueDate);
        }

        check_attachements(attachmentFileNames, issue);

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
                            IssueStatus status,
                            List<Long> assigneeIds,
                            List<String> attachmentFileNames) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        if (!projectAccess.hasAccess(userId, issue.getProjectId())) {
            throw new SecurityException("User is not a member of the project");
        }

        var projectOpt = projectQueryApi.getProjectById(issue.getProjectId());
        if (projectOpt.isPresent() && projectOpt.get().archived()) {
            throw new SecurityException("Cannot update issue in archived project");
        }

        String role = projectAccess.getUserRole(userId, issue.getProjectId())
            .orElseThrow(() -> new SecurityException("User has no role"));

        boolean isAssignee = issue.getAssigneeIds() != null
            && issue.getAssigneeIds().contains(userId);
        boolean isAuthor = issue.getAuthorId() != null && issue.getAuthorId().equals(userId);

        if (isReviewerOrHigher(role) && !userId.equals(issue.getAuthorId()) && !isAssignee) {
            throw new SecurityException("Access denied");
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
            issue.setAssigneeIds(assigneeIds);
        }

        check_attachements(attachmentFileNames, issue);

        if (status != null && status != issue.getStatus()) {
            if (!lifecycle.canTransition(issue.getStatus(), status, role, isAssignee, isAuthor)) {
                throw new SecurityException("Transition denied by lifecycle rules");
            }
            issue.setStatus(status);
            if (status == IssueStatus.DONE) {
                issue.setDueDate(LocalDate.now());
            }
        }

        issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueUpdatedEvent(
            issue.getId(), issue.getProjectId(), userId, "Issue updated"
        ));
    }

    private void check_attachements(List<String> attachmentFileNames, Issue issue) {
        if (attachmentFileNames != null) {
            List<Attachment> attachments = attachmentFileNames.stream()
                .map(fileName -> {
                    Attachment att = new Attachment();
                    att.setOriginalFileName(fileName);
                    att.setFileUrl(fileName);
                    att.setIssue(issue);
                    return att;
                })
                .toList();
            issue.setAttachments(attachments);
        }
    }

    @Override
    @Transactional
    public void changeStatus(Long issueId, Long userId, IssueStatus newStatus) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        String role = projectAccess.getUserRole(userId, issue.getProjectId())
            .orElseThrow(() -> new SecurityException("User has no role"));

        boolean isAssignee = issue.getAssigneeIds() != null
            && issue.getAssigneeIds().contains(userId);
        boolean isAuthor = issue.getAuthorId() != null && issue.getAuthorId().equals(userId);

        if (!lifecycle.canTransition(issue.getStatus(), newStatus, role, isAssignee, isAuthor)) {
            throw new SecurityException("Transition denied by lifecycle rules");
        }

        issue.setStatus(newStatus);

        if (newStatus == IssueStatus.DONE) {
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
        Issue issue = issueRepository.findById(issueId).orElseThrow();
        String role = projectAccess.getUserRole(userId, issue.getProjectId()).orElse("");

        if (isReviewerOrHigher(role)) {
            throw new SecurityException("Only Reviewer/Admin/Owner can delete issues");
        }

        issue.setDeletedAt(LocalDateTime.now());
        issueRepository.save(issue);
    }

    @Override
    @Transactional
    public void restoreFromTrash(Long issueId, Long userId) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();
        String role = projectAccess.getUserRole(userId, issue.getProjectId()).orElse("");

        if (isReviewerOrHigher(role)) {
            throw new SecurityException("Access denied");
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
                assignees = assignees.stream().filter(id -> !id.equals(userId)).toList();
                issue.setAssigneeIds(assignees);
                if (assignees.isEmpty()) {
                    issue.setStatus(IssueStatus.BACKLOG);
                }
                issueRepository.save(issue);
            }
        }
    }

    private boolean isReviewerOrHigher(String role) {
        return !"REVIEWER".equals(role) && !"ADMIN".equals(role) && !"OWNER".equals(role);
    }

    // --- QUERY API IMPL ---

    @Override
    @Transactional(readOnly = true)
    public IssueDto getById(Long id) {
        return issueRepository.findById(id)
            .map(mapper::toDto)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueDto> getBoardIssues(Long projectId, IssueFilterDto filter) {
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
                stream = stream.filter(i -> i.getStartDate() != null && !i.getStartDate().isBefore(filter.dateFrom()));
            }
            if (filter.dateTo() != null) {
                stream = stream.filter(i -> i.getStartDate() != null && !i.getStartDate().isAfter(filter.dateTo()));
            }
        }

        return stream
            .sorted(Comparator.comparing(Issue::getPriority))
            .map(mapper::toDto)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueDto> getTrashBin(Long projectId) {
        return issueRepository.findDeletedByProjectId(projectId).stream()
            .map(mapper::toDto)
            .toList();
    }
}