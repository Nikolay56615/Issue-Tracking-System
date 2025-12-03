package issue.tracking.system.issuetrackingsystem.issue.api;

public record IssueUpdatedEvent(
    Long issueId,
    Long projectId,
    Long actorId, // Кто изменил (чтобы не отправлять уведомление ему самому)
    String message // Например: "Status changed to DONE"
) {}
