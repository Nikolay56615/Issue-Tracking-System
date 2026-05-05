package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;
import java.util.List;

interface TransitionRule {

    /**
     * Проверяет конкретное бизнес-правило.
     *
     * @return true, если правило выполнено (или не применимо). False, если запрет.
     */
    boolean check(String from, String to, String role, boolean isAssignee,
        boolean isAuthor);

    List<TransitionDto> describeTransitions();
}
