package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;

interface TransitionRule {

    /**
     * Проверяет конкретное бизнес-правило.
     *
     * @return true, если правило выполнено (или не применимо). False, если запрет.
     */
    boolean check(IssueStatus from, IssueStatus to, String role, boolean isAssignee,
        boolean isAuthor);
}
