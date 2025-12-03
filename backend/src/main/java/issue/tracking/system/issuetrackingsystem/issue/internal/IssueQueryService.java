package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.IssueDto;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueFilterDto;
import java.util.List;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // Только чтение
public class IssueQueryService {

    private final IssueRepository issueRepository;

    public IssueDto getById(Long id) {
        return issueRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
    }

    // View Board (с фильтрацией)
    public List<IssueDto> getBoardIssues(Long projectId, IssueFilterDto filter) {
        // 1. Получаем все активные задачи проекта
        List<Issue> issues = issueRepository.findAllActiveByProjectId(projectId);

        Stream<Issue> stream = issues.stream();

        if (filter != null) {
            if (filter.types() != null && !filter.types().isEmpty()) {
                stream = stream.filter(i -> filter.types().contains(i.getType()));
            }
            if (filter.priorities() != null && !filter.priorities().isEmpty()) {
                stream = stream.filter(i -> filter.priorities().contains(i.getPriority()));
            }
            if (filter.assigneeId() != null) {
                stream = stream.filter(i -> filter.assigneeId().equals(i.getAssigneeId()));
            }
            if (filter.nameQuery() != null && !filter.nameQuery().isBlank()) {
                String q = filter.nameQuery().toLowerCase();
                stream = stream.filter(i -> i.getName().toLowerCase().contains(q));
            }
        }

        // По умолчанию сортируем по приоритету, затем по дате
        // В реальном проекте SortOrder тоже приходил бы в параметрах
        return stream
            .sorted((i1, i2) -> i1.getPriority().compareTo(i2.getPriority()))
            .map(this::toDto)
            .toList();
    }

    public List<IssueDto> getTrashBin(Long projectId) {
        return issueRepository.findDeletedByProjectId(projectId).stream()
            .map(this::toDto)
            .toList();
    }

    // Mapper Method
    private IssueDto toDto(Issue issue) {
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
