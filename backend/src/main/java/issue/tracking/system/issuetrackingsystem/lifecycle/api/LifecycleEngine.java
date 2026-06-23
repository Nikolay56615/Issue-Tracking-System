package issue.tracking.system.issuetrackingsystem.lifecycle.api;

public interface LifecycleEngine {
    boolean canTransition(String from, String to, String role, boolean isAssignee, boolean isAuthor);
    LifecycleGraphDto getTransitionGraph();
}
