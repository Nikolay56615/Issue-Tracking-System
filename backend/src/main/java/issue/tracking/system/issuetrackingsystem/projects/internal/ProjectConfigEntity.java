package issue.tracking.system.issuetrackingsystem.projects.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "project_configs")
@Getter
@Setter
@NoArgsConstructor
public class ProjectConfigEntity {

    @Id
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "config_json", nullable = false, columnDefinition = "TEXT")
    private String configJson;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ProjectConfigEntity(Long projectId, String configJson) {
        this.projectId = projectId;
        this.configJson = configJson;
        this.updatedAt = LocalDateTime.now();
    }
}
