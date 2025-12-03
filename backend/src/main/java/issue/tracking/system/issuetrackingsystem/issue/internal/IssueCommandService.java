package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.IssueCreatedEvent;
import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueUpdatedEvent;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.LifecycleEngine;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectAccessApi;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class IssueCommandService {

    private final IssueRepository issueRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ProjectAccessApi projectAccess;
    private final LifecycleEngine lifecycle;

    @Transactional
    public Long createIssue(Long userId, Long projectId, String name, IssueType type,
        IssuePriority priority, String description) {
        // Precondition: User in project
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

        // Assignee auto-filled by creator
        issue.setAssigneeId(userId);

        // Status auto-filled to Backlog
        issue.setStatus(IssueStatus.BACKLOG);

        // Start date auto-filled
        issue.setStartDate(LocalDate.now());

        Issue saved = issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueCreatedEvent(
            saved.getId(),
            saved.getProjectId(),
            saved.getAuthorId(),
            saved.getName()
        ));

        return saved.getId();
    }

    @Transactional
    public void changeStatus(Long issueId, Long userId, IssueStatus newStatus) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));

        // Получаем роль юзера в проекте (Cross-module call)
        String role = projectAccess.getUserRole(userId, issue.getProjectId())
            .orElseThrow(() -> new SecurityException("User has no role"));

        boolean isAssignee = userId.equals(issue.getAssigneeId());

        // Делегируем проверку правил модулю Lifecycle
        if (!lifecycle.canTransition(issue.getStatus(), newStatus, role, isAssignee)) {
            throw new SecurityException("Transition denied by lifecycle rules");
        }

        issue.setStatus(newStatus);

        // Due date auto-filled when Done
        if (newStatus == IssueStatus.DONE) {
            issue.setDueDate(LocalDate.now());
        }

        issue.setStatus(newStatus);
        issueRepository.save(issue);

        eventPublisher.publishEvent(new IssueUpdatedEvent(
            issue.getId(),
            issue.getProjectId(),
            userId,
            "Status changed to " + newStatus
        ));
    }

    @Transactional
    public void moveToTrash(Long issueId, Long userId) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();

        String role = projectAccess.getUserRole(userId, issue.getProjectId()).orElse("");

        // Reviewer can return... Admin can permanently delete.
        // Each task can be deleted by the Reviewer
        if (!isReviewerOrHigher(role)) {
            throw new SecurityException("Only Reviewer/Admin/Owner can delete issues");
        }

        issue.setDeletedAt(LocalDateTime.now());
        issueRepository.save(issue);
    }

    // Restore from Basket
    @Transactional
    public void restoreFromTrash(Long issueId, Long userId) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();

        String role = projectAccess.getUserRole(userId, issue.getProjectId()).orElse("");

        // Reviewer can return the issue
        if (!isReviewerOrHigher(role)) {
            throw new SecurityException("Access denied");
        }

        issue.setDeletedAt(null);
        issueRepository.save(issue);
    }

    private boolean isReviewerOrHigher(String role) {
        return "REVIEWER".equals(role) || "ADMIN".equals(role) || "OWNER".equals(role);
    }
}
