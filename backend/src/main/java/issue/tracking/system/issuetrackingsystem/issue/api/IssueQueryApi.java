package issue.tracking.system.issuetrackingsystem.issue.api;

import java.util.List;

public interface IssueQueryApi {
    IssueDto getById(Long userId, Long id);
    List<IssueDto> getBoardIssues(Long userId, Long projectId, IssueFilterDto filter);
    List<IssueDto> getTrashBin(Long userId, Long projectId);
}
