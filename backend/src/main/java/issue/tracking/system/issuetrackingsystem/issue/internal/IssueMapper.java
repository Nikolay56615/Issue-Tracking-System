package issue.tracking.system.issuetrackingsystem.issue.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import issue.tracking.system.issuetrackingsystem.issue.api.AttachmentDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class IssueMapper {

    private final ObjectMapper objectMapper;
    private static final TypeReference<Map<String, Object>> CUSTOM_FIELDS_TYPE =
        new TypeReference<>() {};

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
            attachments,
            readCustomFields(issue)
        );
    }

    public Map<String, Object> readCustomFields(Issue issue) {
        if (issue.getCustomFieldsJson() == null || issue.getCustomFieldsJson().isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(issue.getCustomFieldsJson(), CUSTOM_FIELDS_TYPE);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Issue custom fields are not readable", ex);
        }
    }

    public String writeCustomFields(Map<String, Object> customFields) {
        if (customFields == null || customFields.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(customFields);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Issue custom fields are not writable", ex);
        }
    }
}
