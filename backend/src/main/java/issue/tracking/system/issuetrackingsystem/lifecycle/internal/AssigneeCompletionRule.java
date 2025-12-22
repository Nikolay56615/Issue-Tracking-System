package issue.tracking.system.issuetrackingsystem.lifecycle.internal;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.TransitionDto;

import java.util.ArrayList;
import java.util.List;

@Component
@Order(2)
public class AssigneeCompletionRule implements TransitionRule {

    @Override
    public boolean check(IssueStatus from, IssueStatus to, String role, boolean isAssignee, boolean isAuthor) {
        // Если ты Исполнитель (Assignee)
        if (isAssignee) {
            // Можно начать работу (Backlog -> In Progress)
            if (from == IssueStatus.BACKLOG && to == IssueStatus.IN_PROGRESS) return true;

            // Можно отправить на проверку (In Progress -> Review)
            if (from == IssueStatus.IN_PROGRESS && to == IssueStatus.REVIEW) return true;
        }

        // Если ты Автор (Author) - например, автор может закрыть задачу, если она в Review
        // Допустим, автор может отменить задачу (вернуть в Backlog).
        if (isAuthor) {
            return from == IssueStatus.IN_PROGRESS && to == IssueStatus.BACKLOG;
        }

        return false;
    }

    @Override
    public List<TransitionDto> describeTransitions() {
        List<TransitionDto> result = new ArrayList<>();
        result.add(new TransitionDto(
            IssueStatus.BACKLOG,
            IssueStatus.IN_PROGRESS,
            List.of(),
            false,
            true
        ));
        result.add(new TransitionDto(
            IssueStatus.IN_PROGRESS,
            IssueStatus.REVIEW,
            List.of(),
            false,
            true
        ));
        result.add(new TransitionDto(
            IssueStatus.IN_PROGRESS,
            IssueStatus.BACKLOG,
            List.of(),
            true,
            false
        ));
        return result;
    }
}
