package issue.tracking.system.issuetrackingsystem;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import issue.tracking.system.issuetrackingsystem.users.internal.UserRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectConfigurationIntegrationTest {

    private static final String PASSWORD = "Passw0rd!";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<Map<String, Object>>> LIST_OF_MAPS_TYPE =
        new TypeReference<>() {};

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void projectConfigContainsDefaultRolesVisionLifecycleAndFreeMode() throws Exception {
        TestUser owner = register("default-owner");
        long projectId = createProject(owner, "Default project");

        Map<String, Object> config = getProjectConfig(owner, projectId);
        Map<String, Object> lifecycle = object(config.get("lifecycle"));

        assertThat(booleanValue(lifecycle.get("transitionRulesEnabled"))).isFalse();
        assertThat(list(config.get("roles")))
            .extracting(role -> text(role.get("id")))
            .containsExactly("WORKER", "REVIEWER", "ADMIN", "OWNER");
        assertThat(list(lifecycle.get("statuses")))
            .extracting(status -> text(status.get("id")))
            .containsExactly("BACKLOG", "IN_PROGRESS", "REVIEW", "DONE");
        assertThat(list(lifecycle.get("transitions")))
            .extracting(transition -> text(transition.get("id")))
            .contains(
                "BACKLOG__IN_PROGRESS",
                "IN_PROGRESS__REVIEW",
                "REVIEW__DONE"
            )
            .doesNotContain("BACKLOG__DONE");
    }

    @Test
    void createdProjectOwnerGetsRoleObjectWithPermissions() throws Exception {
        TestUser owner = register("role-owner");
        long projectId = createProject(owner, "Role project");

        MvcResult roleResult = mockMvc.perform(get("/api/projects/{id}/my-role", projectId)
                .with(httpBasic(owner.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();

        Map<String, Object> role = object(readMap(roleResult).get("role"));
        assertThat(text(role.get("id"))).isEqualTo("OWNER");
        assertThat(listObjects(role.get("permissions"))).isNotEmpty();
    }

    @Test
    void disabledTransitionRulesAllowAnyProjectMemberToMoveIssueAnywhere() throws Exception {
        TestUser owner = register("free-owner");
        TestUser worker = register("free-worker");
        long projectId = createProject(owner, "Free lifecycle project");
        invite(owner, projectId, worker.id(), "WORKER");

        long issueId = createIssue(worker, projectId, "Jump issue", Map.of());

        changeIssueStatus(worker, issueId, "DONE", 200);

        Map<String, Object> issue = getIssue(worker, issueId);
        assertThat(text(issue.get("status"))).isEqualTo("DONE");
    }

    @Test
    void missingTransitionRulesFlagKeepsFreeModeDefault() throws Exception {
        TestUser owner = register("missing-flag-owner");
        long projectId = createProject(owner, "Missing transition flag project");

        Map<String, Object> config = getProjectConfig(owner, projectId);
        Map<String, Object> lifecycle = mutableObject(config.get("lifecycle"));
        lifecycle.remove("transitionRulesEnabled");
        config.put("lifecycle", lifecycle);

        saveProjectConfig(owner, projectId, config);

        Map<String, Object> savedConfig = getProjectConfig(owner, projectId);
        assertThat(booleanValue(object(savedConfig.get("lifecycle")).get("transitionRulesEnabled"))).isFalse();
    }

    @Test
    void enabledTransitionRulesUseSavedLifecycleGraphAndConditions() throws Exception {
        TestUser owner = register("strict-owner");
        TestUser worker = register("strict-worker");
        long projectId = createProject(owner, "Strict lifecycle project");
        invite(owner, projectId, worker.id(), "WORKER");
        setTransitionRulesEnabled(owner, projectId, true);

        long deniedIssueId = createIssue(worker, projectId, "Denied jump", Map.of());
        changeIssueStatus(worker, deniedIssueId, "DONE", 401);

        Map<String, Object> deniedIssue = getIssue(worker, deniedIssueId);
        assertThat(text(deniedIssue.get("status"))).isEqualTo("BACKLOG");

        long allowedIssueId = createIssue(worker, projectId, "Allowed step", Map.of());
        changeIssueStatus(worker, allowedIssueId, "IN_PROGRESS", 200);

        Map<String, Object> allowedIssue = getIssue(worker, allowedIssueId);
        assertThat(text(allowedIssue.get("status"))).isEqualTo("IN_PROGRESS");
    }

    @Test
    void dateCustomFieldIsSavedReturnedAndFilterable() throws Exception {
        TestUser owner = register("date-owner");
        long projectId = createProject(owner, "Date fields project");
        addDateCustomField(owner, projectId, "targetDate", "Target date");

        long matchingIssueId = createIssue(
            owner,
            projectId,
            "Matching date",
            Map.of("targetDate", "2026-05-06")
        );
        createIssue(
            owner,
            projectId,
            "Other date",
            Map.of("targetDate", "2026-05-07")
        );

        Map<String, Object> savedIssue = getIssue(owner, matchingIssueId);
        assertThat(object(savedIssue.get("customFields")))
            .containsEntry("targetDate", "2026-05-06");

        List<Map<String, Object>> filteredIssues = board(owner, projectId, Map.of(
            "customFields", Map.of("targetDate", "2026-05-06")
        ));
        assertThat(filteredIssues)
            .extracting(issue -> text(issue.get("name")))
            .containsExactly("Matching date");
    }

    @Test
    void projectTemplateExportsAndAppliesConfigurationOnly() throws Exception {
        TestUser owner = register("template-owner");
        long sourceProjectId = createProject(owner, "Source project");
        long targetProjectId = createProject(owner, "Target project");
        addDateCustomField(owner, sourceProjectId, "releaseDate", "Release date");

        MvcResult templateResult = mockMvc.perform(get("/api/projects/{id}/template", sourceProjectId)
                .with(httpBasic(owner.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        Map<String, Object> template = readMap(templateResult);
        assertThat(object(template.get("config")).get("customFields")).isNotNull();

        mockMvc.perform(post("/api/projects/{id}/template", targetProjectId)
                .with(httpBasic(owner.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("sourceProjectId", sourceProjectId))))
            .andExpect(status().isOk());

        Map<String, Object> targetConfig = getProjectConfig(owner, targetProjectId);
        assertThat(list(targetConfig.get("customFields")))
            .extracting(field -> text(field.get("name")))
            .contains("Release date");

        long importTargetProjectId = createProject(owner, "Import target project");
        mockMvc.perform(post("/api/projects/{id}/template/import", importTargetProjectId)
                .with(httpBasic(owner.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("config", template.get("config")))))
            .andExpect(status().isOk());

        Map<String, Object> importTargetConfig = getProjectConfig(owner, importTargetProjectId);
        assertThat(list(importTargetConfig.get("customFields")))
            .extracting(field -> text(field.get("name")))
            .contains("Release date");
    }

    @Test
    void issueReadBoardAndTrashRequireProjectMembershipAndIssueView() throws Exception {
        TestUser owner = register("access-owner");
        TestUser outsider = register("access-outsider");
        TestUser noViewUser = register("access-no-view");
        long projectId = createProject(owner, "Access project");
        long issueId = createIssue(owner, projectId, "Private issue", Map.of());

        mockMvc.perform(get("/api/issues/{id}", issueId)
                .with(httpBasic(outsider.email(), PASSWORD)))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/issues/board")
                .queryParam("projectId", String.valueOf(projectId))
                .with(httpBasic(outsider.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of())))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/issues/trash")
                .queryParam("projectId", String.valueOf(projectId))
                .with(httpBasic(outsider.email(), PASSWORD)))
            .andExpect(status().isUnauthorized());

        Map<String, Object> config = getProjectConfig(owner, projectId);
        List<Map<String, Object>> roles = new ArrayList<>(list(config.get("roles")));
        roles.add(Map.of(
            "id", "NO_VIEW",
            "projectId", projectId,
            "name", "No View",
            "permissions", List.of("issue.create")
        ));
        config.put("roles", roles);
        saveProjectConfig(owner, projectId, config);
        invite(owner, projectId, noViewUser.id(), "NO_VIEW");

        mockMvc.perform(get("/api/issues/{id}", issueId)
                .with(httpBasic(noViewUser.email(), PASSWORD)))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/issues/board")
                .queryParam("projectId", String.valueOf(projectId))
                .with(httpBasic(noViewUser.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of())))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void removedMemberDoesNotSeeProjectInProjectsList() throws Exception {
        TestUser owner = register("member-owner");
        TestUser member = register("member-worker");
        long projectId = createProject(owner, "Membership project");
        invite(owner, projectId, member.id(), "WORKER");

        assertThat(projectIds(member)).contains(projectId);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .delete("/api/projects/{id}/members/{userId}", projectId, member.id())
                .with(httpBasic(owner.email(), PASSWORD)))
            .andExpect(status().isOk());

        assertThat(projectIds(member)).doesNotContain(projectId);
    }

    @Test
    void ownerLikeMemberCanRemoveAnotherOwnerAndProjectOwnerIsReassigned() throws Exception {
        TestUser owner = register("owner-remove-primary");
        TestUser secondOwner = register("owner-remove-secondary");
        long projectId = createProject(owner, "Owner removal project");
        invite(owner, projectId, secondOwner.id(), "OWNER");

        mockMvc.perform(delete("/api/projects/{id}/members/{userId}", projectId, owner.id())
                .with(httpBasic(secondOwner.email(), PASSWORD)))
            .andExpect(status().isOk());

        assertThat(number(getProject(secondOwner, projectId).get("ownerId"))).isEqualTo(secondOwner.id());
        assertThat(projectIds(owner)).doesNotContain(projectId);
    }

    @Test
    void ownerLikeMemberCanDemoteAnotherOwnerAndProjectOwnerIsReassigned() throws Exception {
        TestUser owner = register("owner-demote-primary");
        TestUser secondOwner = register("owner-demote-secondary");
        long projectId = createProject(owner, "Owner demotion project");
        invite(owner, projectId, secondOwner.id(), "OWNER");

        mockMvc.perform(put("/api/projects/{id}/members/{userId}/role", projectId, owner.id())
                .with(httpBasic(secondOwner.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("roleId", "WORKER"))))
            .andExpect(status().isOk());

        assertThat(number(getProject(secondOwner, projectId).get("ownerId"))).isEqualTo(secondOwner.id());
        assertThat(getMembers(secondOwner, projectId).stream()
            .filter(member -> number(member.get("id")) == owner.id())
            .findFirst()
            .map(member -> text(member.get("roleId"))))
            .contains("WORKER");
    }

    @Test
    void lastOwnerLikeMemberCannotBeRemovedOrDemoted() throws Exception {
        TestUser owner = register("last-owner-guard");
        long projectId = createProject(owner, "Last owner guard project");

        mockMvc.perform(delete("/api/projects/{id}/members/{userId}", projectId, owner.id())
                .with(httpBasic(owner.email(), PASSWORD)))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/projects/{id}/members/{userId}/role", projectId, owner.id())
                .with(httpBasic(owner.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("roleId", "WORKER"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void projectConfigCannotRemoveAllOwnerCriticalRolesFromMembers() throws Exception {
        TestUser owner = register("owner-config-guard");
        long projectId = createProject(owner, "Owner config guard project");

        Map<String, Object> config = getProjectConfig(owner, projectId);
        List<Map<String, Object>> roles = new ArrayList<>(list(config.get("roles")));
        Map<String, Object> ownerRole = mutableObject(roles.stream()
            .filter(role -> "OWNER".equals(text(role.get("id"))))
            .findFirst()
            .orElseThrow());
        ownerRole.put("permissions", List.of("issue.view"));
        roles = roles.stream()
            .map(role -> "OWNER".equals(text(role.get("id"))) ? ownerRole : role)
            .toList();
        config.put("roles", roles);

        mockMvc.perform(put("/api/projects/{id}/config", projectId)
                .with(httpBasic(owner.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(config)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void globalAdminSeesAllProjectsAndBypassesProjectAccess() throws Exception {
        TestUser owner = register("global-owner");
        TestUser admin = register("global-admin");
        long projectId = createProject(owner, "Global admin visible project");
        userRepository.findById(admin.id()).ifPresent(user -> {
            user.setGlobalAdmin(true);
            userRepository.save(user);
        });

        assertThat(projectIds(admin)).contains(projectId);

        MvcResult roleResult = mockMvc.perform(get("/api/projects/{id}/my-role", projectId)
                .with(httpBasic(admin.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        assertThat(text(object(readMap(roleResult).get("role")).get("id"))).isEqualTo("GLOBAL_ADMIN");

        mockMvc.perform(post("/api/issues/board")
                .queryParam("projectId", String.valueOf(projectId))
                .with(httpBasic(admin.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of())))
            .andExpect(status().isOk());
    }

    @Test
    void inactiveUserCannotAuthenticate() throws Exception {
        TestUser user = register("inactive-user");
        userRepository.findById(user.id()).ifPresent(entity -> {
            entity.setActive(false);
            userRepository.save(entity);
        });

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "email", user.email(),
                    "password", PASSWORD
                ))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void projectConfigPersistsBoardCardCheckboxEnumAndInitialStatus() throws Exception {
        TestUser owner = register("field-owner");
        long projectId = createProject(owner, "Field project");
        Map<String, Object> config = getProjectConfig(owner, projectId);

        Map<String, Object> lifecycle = mutableObject(config.get("lifecycle"));
        List<Map<String, Object>> statuses = new ArrayList<>(list(lifecycle.get("statuses")));
        statuses = statuses.stream()
            .map(status -> {
                Map<String, Object> item = mutableObject(status);
                item.put("isInitial", "IN_PROGRESS".equals(text(item.get("id"))));
                return item;
            })
            .toList();
        lifecycle.put("statuses", statuses);
        config.put("lifecycle", lifecycle);

        List<Map<String, Object>> customFields = new ArrayList<>(list(config.get("customFields")));
        customFields.add(Map.of(
            "id", "qaRequired",
            "projectId", projectId,
            "name", "QA Required",
            "type", "checkbox",
            "required", false,
            "config", Map.of()
        ));
        customFields.add(Map.of(
            "id", "risk",
            "projectId", projectId,
            "name", "Risk",
            "type", "enum",
            "required", false,
            "config", Map.of("options", List.of(
                Map.of("id", "low", "label", "Low", "color", "#16a34a"),
                Map.of("id", "blocked", "label", "Blocked", "color", "#ef4444")
            ))
        ));
        config.put("customFields", customFields);

        List<String> fieldOrder = new ArrayList<>();
        for (Object fieldIdValue : listObjects(config.get("fieldOrder"))) {
            fieldOrder.add(text(fieldIdValue));
        }
        fieldOrder.add("qaRequired");
        fieldOrder.add("risk");
        config.put("fieldOrder", fieldOrder);

        List<String> boardCardFieldIds = new ArrayList<>();
        for (Object fieldIdValue : listObjects(config.get("boardCardFieldIds"))) {
            boardCardFieldIds.add(text(fieldIdValue));
        }
        boardCardFieldIds.add("qaRequired");
        boardCardFieldIds.add("risk");
        config.put("boardCardFieldIds", boardCardFieldIds);

        saveProjectConfig(owner, projectId, config);

        Map<String, Object> savedConfig = getProjectConfig(owner, projectId);
        assertThat(listObjects(savedConfig.get("boardCardFieldIds"))).contains("qaRequired", "risk");
        assertThat(list(savedConfig.get("customFields")))
            .extracting(field -> text(field.get("type")))
            .contains("checkbox", "enum");

        long issueId = createIssue(owner, projectId, "Configured initial issue", Map.of("risk", "blocked"));
        Map<String, Object> issue = getIssue(owner, issueId);
        assertThat(text(issue.get("status"))).isEqualTo("IN_PROGRESS");
        assertThat(object(issue.get("customFields")))
            .containsEntry("qaRequired", false)
            .containsEntry("risk", "blocked");
    }

    private TestUser register(String prefix) throws Exception {
        String unique = prefix + "-" + System.nanoTime();
        String email = unique + "@example.test";
        String username = unique;

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "email", email,
                    "username", username,
                    "password", PASSWORD
                ))))
            .andExpect(status().isOk())
            .andReturn();

        Map<String, Object> response = readMap(result);
        return new TestUser(number(response.get("id")), email, username);
    }

    private long createProject(TestUser owner, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projects")
                .with(httpBasic(owner.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("name", name))))
            .andExpect(status().isOk())
            .andReturn();

        return number(readMap(result).get("id"));
    }

    private void invite(TestUser actor, long projectId, long userId, String roleId) throws Exception {
        mockMvc.perform(post("/api/projects/{id}/invite", projectId)
                .with(httpBasic(actor.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "userId", userId,
                    "roleId", roleId
                ))))
            .andExpect(status().isOk());
    }

    private Map<String, Object> getProjectConfig(TestUser user, long projectId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/projects/{id}/config", projectId)
                .with(httpBasic(user.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        return readMap(result);
    }

    private Map<String, Object> getProject(TestUser user, long projectId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/projects/{id}", projectId)
                .with(httpBasic(user.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        return readMap(result);
    }

    private List<Map<String, Object>> getMembers(TestUser user, long projectId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/projects/{id}/members", projectId)
                .with(httpBasic(user.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), LIST_OF_MAPS_TYPE);
    }

    private void saveProjectConfig(TestUser user, long projectId, Map<String, Object> config) throws Exception {
        mockMvc.perform(put("/api/projects/{id}/config", projectId)
                .with(httpBasic(user.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(config)))
            .andExpect(status().isOk());
    }

    private void setTransitionRulesEnabled(TestUser user, long projectId, boolean enabled) throws Exception {
        Map<String, Object> config = getProjectConfig(user, projectId);
        Map<String, Object> lifecycle = mutableObject(config.get("lifecycle"));
        lifecycle.put("transitionRulesEnabled", enabled);
        config.put("lifecycle", lifecycle);
        saveProjectConfig(user, projectId, config);
    }

    private void addDateCustomField(
        TestUser user,
        long projectId,
        String fieldId,
        String fieldName
    ) throws Exception {
        Map<String, Object> config = getProjectConfig(user, projectId);
        List<Map<String, Object>> customFields = new ArrayList<>(list(config.get("customFields")));
        customFields.add(Map.of(
            "id", fieldId,
            "projectId", projectId,
            "name", fieldName,
            "type", "date",
            "required", false,
            "config", Map.of()
        ));
        config.put("customFields", customFields);

        List<String> fieldOrder = new ArrayList<>();
        for (Object fieldIdValue : listObjects(config.get("fieldOrder"))) {
            fieldOrder.add(text(fieldIdValue));
        }
        fieldOrder.add(fieldId);
        config.put("fieldOrder", fieldOrder);

        saveProjectConfig(user, projectId, config);
    }

    private long createIssue(
        TestUser user,
        long projectId,
        String name,
        Map<String, Object> customFields
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/issues")
                .with(httpBasic(user.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "projectId", projectId,
                    "name", name,
                    "type", "TASK",
                    "priority", "HIGH",
                    "description", "",
                    "assigneeIds", List.of(user.id()),
                    "attachmentFileNames", List.of(),
                    "customFields", customFields
                ))))
            .andExpect(status().isOk())
            .andReturn();

        return number(readMap(result).get("id"));
    }

    private Map<String, Object> getIssue(TestUser user, long issueId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/issues/{id}", issueId)
                .with(httpBasic(user.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        return readMap(result);
    }

    private void changeIssueStatus(TestUser user, long issueId, String newStatus, int statusCode) throws Exception {
        mockMvc.perform(put("/api/issues/{id}/status", issueId)
                .with(httpBasic(user.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("newStatus", newStatus))))
            .andExpect(status().is(statusCode));
    }

    private List<Map<String, Object>> board(
        TestUser user,
        long projectId,
        Map<String, Object> filters
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/issues/board")
                .queryParam("projectId", String.valueOf(projectId))
                .with(httpBasic(user.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(filters)))
            .andExpect(status().isOk())
            .andReturn();

        return objectMapper.readValue(result.getResponse().getContentAsString(), LIST_OF_MAPS_TYPE);
    }

    private List<Long> projectIds(TestUser user) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/projects")
                .with(httpBasic(user.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();

        return objectMapper.readValue(result.getResponse().getContentAsString(), LIST_OF_MAPS_TYPE)
            .stream()
            .map(project -> number(project.get("id")))
            .toList();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private Map<String, Object> readMap(MvcResult result) throws Exception {
        return objectMapper.readValue(result.getResponse().getContentAsString(), MAP_TYPE);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> object(Object value) {
        return (Map<String, Object>) value;
    }

    private Map<String, Object> mutableObject(Object value) {
        return new HashMap<>(object(value));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> list(Object value) {
        return (List<Map<String, Object>>) value;
    }

    @SuppressWarnings("unchecked")
    private List<Object> listObjects(Object value) {
        return (List<Object>) value;
    }

    private String text(Object value) {
        return String.valueOf(value);
    }

    private long number(Object value) {
        return ((Number) value).longValue();
    }

    private boolean booleanValue(Object value) {
        return Boolean.TRUE.equals(value);
    }

    private record TestUser(long id, String email, String username) {}
}
