package issue.tracking.system.issuetrackingsystem.projects.internal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findAllByOwnerId(Long ownerId);
    @Query("SELECT p FROM Project p JOIN p.members m WHERE m.userId = :userId")
    List<Project> findAllByMemberUserId(Long userId);
}