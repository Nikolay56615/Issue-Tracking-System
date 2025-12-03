package issue.tracking.system.issuetrackingsystem.notification.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueCreatedEvent;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueUpdatedEvent;
import issue.tracking.system.issuetrackingsystem.users.api.UserRegisteredEvent;

@Component
@RequiredArgsConstructor
class NotificationListener {

    private final NotificationService notificationService;

    @EventListener
    @Async // Чтобы отправка почты не тормозила создание задачи
    public void onIssueCreated(IssueCreatedEvent event) {
        String msg = String.format("New issue '%s' created.", event.issueName());
        notificationService.notifyProjectMembers(event.projectId(), event.authorId(), msg);
    }

    @EventListener
    @Async
    public void onIssueUpdated(IssueUpdatedEvent event) {
        // everyone except those who click the Save button
        // Мы передаем actorId (кто нажал Save) как excludeUserId
        String msg = String.format("Issue #%d updated: %s", event.issueId(), event.message());
        notificationService.notifyProjectMembers(event.projectId(), event.actorId(), msg);
    }

    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        System.out.println("Welcome email sent to " + event.email());
    }
}