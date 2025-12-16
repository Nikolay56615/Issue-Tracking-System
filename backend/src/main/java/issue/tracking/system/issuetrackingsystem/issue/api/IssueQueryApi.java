package issue.tracking.system.issuetrackingsystem.issue.api;

import java.util.List;

public interface IssueQueryApi {
    IssueDto getById(Long id);
    List<IssueDto> getBoardIssues(Long projectId, IssueFilterDto filter);
    List<IssueDto> getTrashBin(Long projectId);
}
