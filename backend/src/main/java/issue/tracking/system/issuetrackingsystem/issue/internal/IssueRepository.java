package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    @Query("SELECT i FROM Issue i WHERE i.projectId = :projectId AND i.deletedAt IS NULL")
    List<Issue> findAllActiveByProjectId(Long projectId);

    @Query("SELECT i FROM Issue i WHERE i.projectId = :projectId AND i.deletedAt IS NOT NULL")
    List<Issue> findDeletedByProjectId(Long projectId);

    List<Issue> findByProjectIdAndStatusAndDeletedAtIsNull(Long projectId, IssueStatus status);
    List<Issue> findByProjectIdAndAssigneeIdsContaining(Long projectId, Long userId);
    List<Issue> findByProjectIdAndAuthorId(Long projectId, Long userId);
}
