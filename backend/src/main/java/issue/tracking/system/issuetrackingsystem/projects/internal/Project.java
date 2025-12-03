package issue.tracking.system.issuetrackingsystem.projects.internal;

import jakarta.persistence.CascadeType;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@NoArgsConstructor
@Entity
@Table(name = "projects")
@Getter
@Setter
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_archived")
    private boolean archived; // Для требования "archivized and deleted after 60 years"

    // Связь One-to-Many (на уровне БД)
    // idColumn - это внешний ключ в таблице project_members, указывающий на project
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Set<ProjectMember> members = new HashSet<>();

    public Project(String name, Long ownerId) {
        this.name = name;
        this.ownerId = ownerId;
        this.createdAt = LocalDateTime.now();
        this.archived = false;
        this.members = new HashSet<>();
    }

    // Логика добавления участника
    public void addMember(Long userId, ProjectRole role) {
        // Проверка на дубликаты (в памяти, перед сохранением)
        boolean exists = this.members.stream()
            .anyMatch(m -> m.getUserId().equals(userId));

        if (exists) {
            throw new IllegalArgumentException("User with ID " + userId + " is already a member.");
        }

        this.members.add(new ProjectMember(userId, role));
    }
}
