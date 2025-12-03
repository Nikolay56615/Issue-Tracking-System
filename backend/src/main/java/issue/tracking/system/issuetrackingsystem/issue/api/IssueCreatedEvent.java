package issue.tracking.system.issuetrackingsystem.issue.api;

public record IssueCreatedEvent(
    Long issueId,
    Long projectId,
    Long authorId,
    String issueName
) {}
