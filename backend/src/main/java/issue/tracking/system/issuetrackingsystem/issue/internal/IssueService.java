package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.*;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
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
    private final LifecycleEngine lifecycle;
    private final IssueMapper mapper;

    // --- COMMAND API IMPL ---

    @Override
    @Transactional
    public Long createIssue(Long userId, Long projectId, String name, IssueType type,
        IssuePriority priority, String description) {
        if (!projectAccess.hasAccess(userId, projectId)) {
            throw new SecurityException("User is not a member of the project");
        }

        Issue issue = new Issue();
        issue.setProjectId(projectId);
        issue.setAuthorId(userId);
        issue.setName(name);
        issue.setDescription(description);
        issue.setType(type);
        issue.setPriority(priority);
        issue.setAssigneeId(userId); // Assignee auto-filled by creator
        issue.setStatus(IssueStatus.BACKLOG); // Default status
        issue.setStartDate(LocalDate.now());

        Issue saved = issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueCreatedEvent(
            saved.getId(), saved.getProjectId(), saved.getAuthorId(), saved.getName()
        ));

        return saved.getId();
    }

    @Override
    @Transactional
    public void updateIssue(Long issueId, Long userId, String name, String description,
        IssuePriority priority, IssueType type) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        if (!projectAccess.hasAccess(userId, issue.getProjectId())) {
            throw new SecurityException("User is not a member of the project");
        }

        String role = projectAccess.getUserRole(userId, issue.getProjectId())
            .orElseThrow(() -> new SecurityException("User has no role"));

        if (!isReviewerOrHigher(role) && !userId.equals(issue.getAuthorId()) && !userId.equals(issue.getAssigneeId())) {
            throw new SecurityException("Access denied");
        }

        issue.setName(name);
        issue.setDescription(description);
        issue.setPriority(priority);
        issue.setType(type);

        issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueUpdatedEvent(
            issue.getId(), issue.getProjectId(), userId, "Issue updated"
        ));
    }

    @Override
    @Transactional
    public void changeStatus(Long issueId, Long userId, IssueStatus newStatus) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        String role = projectAccess.getUserRole(userId, issue.getProjectId())
            .orElseThrow(() -> new SecurityException("User has no role"));

        boolean isAssignee = userId.equals(issue.getAssigneeId());

        if (!lifecycle.canTransition(issue.getStatus(), newStatus, role, isAssignee)) {
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

        if (!isReviewerOrHigher(role)) {
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

        if (!isReviewerOrHigher(role)) {
            throw new SecurityException("Access denied");
        }

        issue.setDeletedAt(null);
        issueRepository.save(issue);
    }

    private boolean isReviewerOrHigher(String role) {
        return "REVIEWER".equals(role) || "ADMIN".equals(role) || "OWNER".equals(role);
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
                stream = stream.filter(i -> filter.assigneeId().equals(i.getAssigneeId()));
            }
            if (filter.nameQuery() != null && !filter.nameQuery().isBlank()) {
                String q = filter.nameQuery().toLowerCase();
                stream = stream.filter(i -> i.getName().toLowerCase().contains(q));
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