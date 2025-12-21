package issue.tracking.system.issuetrackingsystem.issue.internal;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import issue.tracking.system.issuetrackingsystem.issue.api.IssuePriority;
import issue.tracking.system.issuetrackingsystem.issue.api.IssueType;
import issue.tracking.system.issuetrackingsystem.lifecycle.api.IssueStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "issues")
@Getter @Setter
@NoArgsConstructor
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssuePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueStatus status;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @ElementCollection
    @CollectionTable(name = "issue_assignees", joinColumns = @JoinColumn(name = "issue_id"))
    @Column(name = "assignee_id")
    private List<Long> assigneeIds = new ArrayList<>();

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Version
    private Long version;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "issue")
    private List<Attachment> attachments = new ArrayList<>();
}