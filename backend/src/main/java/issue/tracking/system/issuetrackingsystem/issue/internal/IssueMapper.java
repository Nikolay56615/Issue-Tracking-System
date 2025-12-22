package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.AttachmentDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class IssueMapper {

    public IssueDto toDto(Issue issue) {
        if (issue == null) return null;

        List<AttachmentDto> attachments = issue.getAttachments().stream()
            .map(att -> new AttachmentDto(att.getOriginalFileName(), att.getFileUrl()))
            .toList();

        return new IssueDto(
            issue.getId(),
            issue.getProjectId(),
            issue.getName(),
            issue.getDescription(),
            issue.getType(),
            issue.getPriority(),
            issue.getStatus(),
            issue.getAssigneeIds(),
            issue.getAuthorId(),
            issue.getStartDate(),
            issue.getDueDate(),
            attachments
        );
    }
}