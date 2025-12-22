package issue.tracking.system.issuetrackingsystem.lifecycle.api;

public interface LifecycleEngine {
    boolean canTransition(IssueStatus from, IssueStatus to, String role, boolean isAssignee, boolean isAuthor);
    LifecycleGraphDto getTransitionGraph();
}
