package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class IssueMapper {

    public IssueDto toDto(Issue issue) {
        if (issue == null) return null;

        List<String> attachments = issue.getAttachments().stream()
            .map(Attachment::getFileName)
            .toList();

        return new IssueDto(
            issue.getId(),
            issue.getName(),
            issue.getDescription(),
            issue.getType(),
            issue.getPriority(),
            issue.getStatus(),
            issue.getAssigneeId(),
            issue.getAuthorId(),
            issue.getStartDate(),
            issue.getDueDate(),
            attachments
        );
    }
}