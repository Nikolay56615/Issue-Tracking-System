package issue.tracking.system.issuetrackingsystem.projects.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "project_members")
@Getter @Setter
@NoArgsConstructor // JPA требует пустой конструктор
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "role", nullable = false)
    private String roleId;

    public ProjectMember(Long userId, String roleId) {
        this.userId = userId;
        this.roleId = roleId;
    }
}
