package issue.tracking.system.issuetrackingsystem.projects.internal;

import issue.tracking.system.issuetrackingsystem.projects.api.CustomFieldDefinitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomRoleDto;
import issue.tracking.system.issuetrackingsystem.projects.api.CustomStatusDto;
import issue.tracking.system.issuetrackingsystem.projects.api.LifecycleConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTemplateConfigDto;
import issue.tracking.system.issuetrackingsystem.projects.api.ProjectTransitionDto;
import issue.tracking.system.issuetrackingsystem.projects.api.TransitionConditionDto;
import java.util.ArrayList;
import java.util.List;

final class ProjectConfigDefaults {

    static final String WORKER = "WORKER";
    static final String REVIEWER = "REVIEWER";
    static final String ADMIN = "ADMIN";
    static final String OWNER = "OWNER";
    static final String GLOBAL_ADMIN = "GLOBAL_ADMIN";

    static final List<String> PERMISSIONS = List.of(
        "issue.view",
        "issue.create",
        "issue.edit",
        "issue.remove",
        "members.view",
        "members.invite",
        "members.remove",
        "members.assignRole",
        "settings.manage",
        "project.archive",
        "project.restore",
        "template.export",
        "template.apply"
    );

    static final List<String> OWNER_CRITICAL_PERMISSIONS = List.of(
        "settings.manage",
        "members.invite",
        "members.remove",
        "members.assignRole"
    );

    private static final List<String> SYSTEM_FIELD_ORDER = List.of(
        "name",
        "description",
        "type",
        "priority",
        "assignee",
        "author",
        "startDate",
        "dueDate",
        "attachments"
    );

    private static final List<String> DEFAULT_BOARD_CARD_SYSTEM_FIELD_IDS = List.of(
        "description",
        "dueDate",
        "type",
        "priority"
    );

    private ProjectConfigDefaults() {}

    static ProjectTemplateConfigDto defaultTemplate(Long projectId) {
        List<CustomRoleDto> roles = defaultRoles(projectId);
        List<CustomStatusDto> statuses = defaultStatuses(projectId);

        return new ProjectTemplateConfigDto(
            roles,
            new LifecycleConfigDto(false, statuses, defaultTransitions(roles)),
            List.of(),
            SYSTEM_FIELD_ORDER,
            DEFAULT_BOARD_CARD_SYSTEM_FIELD_IDS
        );
    }

    static List<CustomRoleDto> defaultRoles(Long projectId) {
        return List.of(
            new CustomRoleDto(
                WORKER,
                projectId,
                "Worker",
                List.of("issue.view", "issue.create", "issue.edit")
            ),
            new CustomRoleDto(
                REVIEWER,
                projectId,
                "Reviewer",
                List.of("issue.view", "issue.create", "issue.edit", "issue.remove")
            ),
            new CustomRoleDto(
                ADMIN,
                projectId,
                "Admin",
                List.of(
                    "issue.view",
                    "issue.create",
                    "issue.edit",
                    "issue.remove",
                    "members.view",
                    "members.invite",
                    "members.remove",
                    "members.assignRole",
                    "settings.manage",
                    "template.export",
                    "template.apply"
                )
            ),
            new CustomRoleDto(
                OWNER,
                projectId,
                "Owner",
                PERMISSIONS
            )
        );
    }

    static CustomRoleDto globalAdminRole(Long projectId) {
        return new CustomRoleDto(
            GLOBAL_ADMIN,
            projectId,
            "Global Admin",
            PERMISSIONS
        );
    }

    static List<CustomStatusDto> defaultStatuses(Long projectId) {
        return List.of(
            new CustomStatusDto("BACKLOG", projectId, "Backlog", 1, "#64748b", true),
            new CustomStatusDto("IN_PROGRESS", projectId, "In Progress", 2, "#2563eb", false),
            new CustomStatusDto("REVIEW", projectId, "Review", 3, "#f59e0b", false),
            new CustomStatusDto("DONE", projectId, "Done", 4, "#16a34a", false)
        );
    }

    static List<ProjectTransitionDto> allToAllTransitions(
        List<CustomStatusDto> statuses,
        List<CustomRoleDto> roles
    ) {
        List<ProjectTransitionDto> transitions = new ArrayList<>();
        for (CustomStatusDto from : statuses) {
            for (CustomStatusDto to : statuses) {
                if (from.id().equals(to.id())) {
                    continue;
                }
                transitions.add(new ProjectTransitionDto(
                    from.id() + "__" + to.id(),
                    from.id(),
                    to.id(),
                    roles.stream()
                        .map(role -> new TransitionConditionDto("role", role.id(), null))
                        .toList()
                ));
            }
        }
        return transitions;
    }

    static List<ProjectTransitionDto> defaultTransitions(List<CustomRoleDto> roles) {
        List<String> privilegedRoleIds = roles.stream()
            .map(CustomRoleDto::id)
            .filter(roleId -> !WORKER.equals(roleId))
            .toList();

        return List.of(
            transition("BACKLOG", "IN_PROGRESS", roleConditions(roles)),
            transition("IN_PROGRESS", "REVIEW", roleConditions(roles)),
            transition("REVIEW", "DONE", roleConditions(privilegedRoleIds)),
            transition("IN_PROGRESS", "BACKLOG", roleConditions(privilegedRoleIds)),
            transition("REVIEW", "IN_PROGRESS", roleConditions(privilegedRoleIds)),
            transition("DONE", "BACKLOG", roleConditions(privilegedRoleIds))
        );
    }

    private static ProjectTransitionDto transition(
        String fromStatusId,
        String toStatusId,
        List<TransitionConditionDto> conditions
    ) {
        return new ProjectTransitionDto(
            fromStatusId + "__" + toStatusId,
            fromStatusId,
            toStatusId,
            conditions
        );
    }

    private static List<TransitionConditionDto> roleConditions(List<?> rolesOrRoleIds) {
        return rolesOrRoleIds.stream()
            .map(item -> item instanceof CustomRoleDto role ? role.id() : String.valueOf(item))
            .map(roleId -> new TransitionConditionDto("role", roleId, null))
            .toList();
    }

    static List<String> defaultFieldOrder(List<CustomFieldDefinitionDto> customFields) {
        List<String> order = new ArrayList<>(SYSTEM_FIELD_ORDER);
        customFields.stream().map(CustomFieldDefinitionDto::id).forEach(order::add);
        return order;
    }

    static List<String> defaultBoardCardFieldIds(List<CustomFieldDefinitionDto> customFields) {
        List<String> fieldIds = new ArrayList<>(DEFAULT_BOARD_CARD_SYSTEM_FIELD_IDS);
        customFields.stream().map(CustomFieldDefinitionDto::id).forEach(fieldIds::add);
        return fieldIds;
    }
}
