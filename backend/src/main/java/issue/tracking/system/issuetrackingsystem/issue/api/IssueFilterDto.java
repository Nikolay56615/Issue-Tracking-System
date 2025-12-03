package issue.tracking.system.issuetrackingsystem.issue.api;

import java.time.LocalDate;
import java.util.Set;

public record IssueFilterDto(
    Set<IssueType> types,       // Filter by type (OR logic)
    Set<IssuePriority> priorities, // Filter by priority
    Long assigneeId,            // Filter by assignee
    String nameQuery,           // Search by name
    LocalDate dateFrom,         // Date range filter
    LocalDate dateTo
) {}
