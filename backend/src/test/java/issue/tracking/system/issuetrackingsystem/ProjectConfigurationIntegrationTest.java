package issue.tracking.system.issuetrackingsystem;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
            .extracting(field -> text(field.get("id")))
            .contains("releaseDate");
    }

    @Test
    void boardCardFieldSelectionIsSavedAndReturned() throws Exception {
        TestUser owner = register("card-fields-owner");
        long projectId = createProject(owner, "Card fields project");
        Map<String, Object> config = getProjectConfig(owner, projectId);
        config.put("boardCardFieldIds", List.of("priority", "assignee"));

        saveProjectConfig(owner, projectId, config);

        assertThat(listObjects(getProjectConfig(owner, projectId).get("boardCardFieldIds")))
            .containsExactly("priority", "assignee");
    }

    @Test
    void projectOwnerCannotBeDemotedOrRemoved() throws Exception {
        TestUser owner = register("protected-owner");
        TestUser admin = register("protected-admin");
        long projectId = createProject(owner, "Protected owner project");
        invite(owner, projectId, admin.id(), "ADMIN");

        mockMvc.perform(put("/api/projects/{id}/members/{userId}/role", projectId, owner.id())
                .with(httpBasic(owner.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("roleId", "WORKER"))))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/projects/{id}/members/{userId}", projectId, owner.id())
                .with(httpBasic(admin.email(), PASSWORD)))
            .andExpect(status().isUnauthorized());

        MvcResult roleResult = mockMvc.perform(get("/api/projects/{id}/my-role", projectId)
                .with(httpBasic(owner.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        assertThat(text(object(readMap(roleResult).get("role")).get("id")))
            .isEqualTo("OWNER");
    }

    @Test
    void boardRequiresIssueViewPermission() throws Exception {
        TestUser owner = register("board-owner");
        TestUser worker = register("board-worker");
        long projectId = createProject(owner, "Restricted board project");
        invite(owner, projectId, worker.id(), "WORKER");
        Map<String, Object> config = getProjectConfig(owner, projectId);
        List<Map<String, Object>> roles = new ArrayList<>(list(config.get("roles")));
        for (Map<String, Object> role : roles) {
            if ("WORKER".equals(text(role.get("id")))) {
                role.put("permissions", List.of("issue.create", "issue.edit", "members.view"));
            }
        }
        config.put("roles", roles);
        saveProjectConfig(owner, projectId, config);

        mockMvc.perform(post("/api/issues/board")
                .queryParam("projectId", String.valueOf(projectId))
                .with(httpBasic(worker.email(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of())))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void removedMemberNoLongerReceivesProjectFromProjectsEndpoint() throws Exception {
        TestUser owner = register("remove-owner");
        TestUser member = register("remove-member");
        long projectId = createProject(owner, "Membership cleanup project");
        invite(owner, projectId, member.id(), "WORKER");

        mockMvc.perform(delete("/api/projects/{id}/members/{userId}", projectId, member.id())
                .with(httpBasic(owner.email(), PASSWORD)))
            .andExpect(status().isOk());

        MvcResult projectsResult = mockMvc.perform(get("/api/projects")
                .with(httpBasic(member.email(), PASSWORD)))
            .andExpect(status().isOk())
            .andReturn();
        List<Map<String, Object>> visibleProjects = objectMapper.readValue(
            projectsResult.getResponse().getContentAsString(),
            LIST_OF_MAPS_TYPE
        );
        assertThat(visibleProjects)
            .extracting(project -> number(project.get("id")))
            .doesNotContain(projectId);
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
