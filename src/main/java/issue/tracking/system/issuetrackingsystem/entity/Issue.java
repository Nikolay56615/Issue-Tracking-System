package issue.tracking.system.issuetrackingsystem.entity;

public class Issue {
    // constructors, getters, setters
}

enum IssueType {
    TASK, BUG, FEATURE, SEARCH
}

enum IssueStatus {
    BACKLOG, IN_PROGRESS, REVIEW, DONE
}

enum Priority {
    URGENT, HIGH, MEDIUM, LOW
}
