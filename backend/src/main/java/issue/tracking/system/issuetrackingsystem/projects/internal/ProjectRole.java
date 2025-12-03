package issue.tracking.system.issuetrackingsystem.projects.internal;

public enum ProjectRole {
    WORKER,   // Create, View, Sort, Edit (limited)
    REVIEWER, // + Full Edit, Remove
    ADMIN,    // + Assign roles
    OWNER     // + Delete project
}
