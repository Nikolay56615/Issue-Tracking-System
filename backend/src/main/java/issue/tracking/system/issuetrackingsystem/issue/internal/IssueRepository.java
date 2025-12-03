package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    // ищем только "живые" задачи
    @Query("SELECT i FROM Issue i WHERE i.projectId = :projectId AND i.deletedAt IS NULL")
    List<Issue> findAllActiveByProjectId(Long projectId);

    // ищем задачи в корзине
    @Query("SELECT i FROM Issue i WHERE i.projectId = :projectId AND i.deletedAt IS NOT NULL")
    List<Issue> findDeletedByProjectId(Long projectId);

    // Автоматическая генерация запроса по имени метода
    List<Issue> findByProjectIdAndStatusAndDeletedAtIsNull(Long projectId, IssueStatus status);
}
