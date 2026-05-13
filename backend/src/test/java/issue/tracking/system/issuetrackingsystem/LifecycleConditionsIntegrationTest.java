package issue.tracking.system.issuetrackingsystem;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class LifecycleConditionsIntegrationTest {

    private static final String PASSWORD = "Passw0rd!";

    private static final TypeReference<Map<String, Object>> MAP_TYPE =
            new TypeReference<>() {};

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void authorConditionAllowsOnlyIssueAuthorToTransition() throws Exception {

        TestUser owner = register("author-owner");
        TestUser author = register("author-user");
        TestUser another = register("another-user");

        long projectId = createProject(owner, "Author condition");

        invite(owner, projectId, author.id(), "WORKER");
        invite(owner, projectId, another.id(), "WORKER");

        setTransitionRulesEnabled(owner, projectId, true);

        configureTransitionCondition(
                owner,
                projectId,
                "REVIEW",
                "DONE",
                List.of(Map.of(
                        "type", "author"
                ))
        );

        long issueId = createIssue(
                author,
                projectId,
                "Author issue",
                Map.of(),
                List.of(author.id())
        );

        changeIssueStatus(author, issueId, "IN_PROGRESS", 200);
        changeIssueStatus(author, issueId, "REVIEW", 200);

        changeIssueStatus(another, issueId, "DONE", 401);

        Map<String, Object> deniedIssue = getIssue(author, issueId);
        assertThat(text(deniedIssue.get("status"))).isEqualTo("REVIEW");

        changeIssueStatus(author, issueId, "DONE", 200);

        Map<String, Object> completedIssue = getIssue(author, issueId);
        assertThat(text(completedIssue.get("status"))).isEqualTo("DONE");
    }

    @Test
    void assigneeConditionAllowsOnlyAssigneeToTransition() throws Exception {

        TestUser owner = register("assignee-owner");
        TestUser assignee = register("assignee-user");
        TestUser another = register("another-assignee");

        long projectId = createProject(owner, "Assignee condition");

        invite(owner, projectId, assignee.id(), "WORKER");
        invite(owner, projectId, another.id(), "WORKER");

        setTransitionRulesEnabled(owner, projectId, true);

        configureTransitionCondition(
                owner,
                projectId,
                "REVIEW",
                "DONE",
                List.of(Map.of(
                        "type", "assignee"
                ))
        );

        long issueId = createIssue(
                owner,
                projectId,
                "Assignee issue",
                Map.of(),
                List.of(assignee.id())
        );

        changeIssueStatus(owner, issueId, "IN_PROGRESS", 200);
        changeIssueStatus(owner, issueId, "REVIEW", 200);

        changeIssueStatus(another, issueId, "DONE", 401);

        Map<String, Object> deniedIssue = getIssue(owner, issueId);
        assertThat(text(deniedIssue.get("status"))).isEqualTo("REVIEW");

        changeIssueStatus(assignee, issueId, "DONE", 200);

        Map<String, Object> completedIssue = getIssue(owner, issueId);
        assertThat(text(completedIssue.get("status"))).isEqualTo("DONE");
    }

    @Test
    void fieldUserReferenceConditionAllowsReferencedUserToTransition() throws Exception {

        TestUser owner = register("field-owner");
        TestUser qa = register("qa-user");
        TestUser another = register("another-qa");

        long projectId = createProject(owner, "Field user reference");

        invite(owner, projectId, qa.id(), "WORKER");
        invite(owner, projectId, another.id(), "WORKER");

        setTransitionRulesEnabled(owner, projectId, true);

        addUserReferenceField(owner, projectId, "qaUser");

        configureTransitionCondition(
                owner,
                projectId,
                "REVIEW",
                "DONE",
                List.of(Map.of(
                        "type", "field_user_reference",
                        "customFieldId", "qaUser"
                ))
        );

        long issueId = createIssue(
                owner,
                projectId,
                "QA issue",
                Map.of(
                        "qaUser", qa.id()
                ),
                List.of(owner.id())
        );

        changeIssueStatus(owner, issueId, "IN_PROGRESS", 200);
        changeIssueStatus(owner, issueId, "REVIEW", 200);

        changeIssueStatus(another, issueId, "DONE", 401);

        Map<String, Object> deniedIssue = getIssue(owner, issueId);
        assertThat(text(deniedIssue.get("status"))).isEqualTo("REVIEW");

        changeIssueStatus(qa, issueId, "DONE", 200);

        Map<String, Object> completedIssue = getIssue(owner, issueId);
        assertThat(text(completedIssue.get("status"))).isEqualTo("DONE");
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

        return new TestUser(
                number(response.get("id")),
                email,
                username
        );
    }

    private long createProject(TestUser owner, String name) throws Exception {

        MvcResult result = mockMvc.perform(post("/api/projects")
                        .with(httpBasic(owner.email(), PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "name", name
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return number(readMap(result).get("id"));
    }

    private void invite(
            TestUser actor,
            long projectId,
            long userId,
            String roleId
    ) throws Exception {

        mockMvc.perform(post("/api/projects/{id}/invite", projectId)
                        .with(httpBasic(actor.email(), PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "userId", userId,
                                "roleId", roleId
                        ))))
                .andExpect(status().isOk());
    }

    private void setTransitionRulesEnabled(
            TestUser user,
            long projectId,
            boolean enabled
    ) throws Exception {

        Map<String, Object> config = getProjectConfig(user, projectId);

        Map<String, Object> lifecycle =
                mutableObject(config.get("lifecycle"));

        lifecycle.put("transitionRulesEnabled", enabled);

        config.put("lifecycle", lifecycle);

        saveProjectConfig(user, projectId, config);
    }

    private void configureTransitionCondition(
            TestUser user,
            long projectId,
            String from,
            String to,
            List<Map<String, Object>> conditions
    ) throws Exception {

        Map<String, Object> config = getProjectConfig(user, projectId);

        Map<String, Object> lifecycle =
                mutableObject(config.get("lifecycle"));

        List<Map<String, Object>> transitions =
                new ArrayList<>(list(lifecycle.get("transitions")));

        List<Map<String, Object>> updated = transitions.stream()
                .map(transition -> {

                    if (from.equals(text(transition.get("fromStatusId")))
                            && to.equals(text(transition.get("toStatusId")))) {

                        Map<String, Object> copy =
                                new HashMap<>(transition);

                        copy.put("conditions", conditions);

                        return copy;
                    }

                    return transition;
                })
                .toList();

        lifecycle.put("transitions", updated);

        config.put("lifecycle", lifecycle);

        saveProjectConfig(user, projectId, config);
    }

    private void addUserReferenceField(
            TestUser user,
            long projectId,
            String fieldId
    ) throws Exception {

        Map<String, Object> config =
                getProjectConfig(user, projectId);

        List<Map<String, Object>> fields =
                new ArrayList<>(list(config.get("customFields")));

        fields.add(Map.of(
                "id", fieldId,
                "projectId", projectId,
                "name", fieldId,
                "type", "user",
                "required", false,
                "config", Map.of()
        ));

        config.put("customFields", fields);

        saveProjectConfig(user, projectId, config);
    }

    private long createIssue(
            TestUser user,
            long projectId,
            String name,
            Map<String, Object> customFields,
            List<Long> assigneeIds
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
                                "assigneeIds", assigneeIds,
                                "attachmentFileNames", List.of(),
                                "customFields", customFields
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return number(readMap(result).get("id"));
    }

    private void changeIssueStatus(
            TestUser user,
            long issueId,
            String newStatus,
            int expectedStatus
    ) throws Exception {

        mockMvc.perform(put("/api/issues/{id}/status", issueId)
                        .with(httpBasic(user.email(), PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "newStatus", newStatus
                        ))))
                .andExpect(status().is(expectedStatus));
    }

    private Map<String, Object> getIssue(
            TestUser user,
            long issueId
    ) throws Exception {

        MvcResult result = mockMvc.perform(get("/api/issues/{id}", issueId)
                        .with(httpBasic(user.email(), PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();

        return readMap(result);
    }

    private Map<String, Object> getProjectConfig(
            TestUser user,
            long projectId
    ) throws Exception {

        MvcResult result = mockMvc.perform(get("/api/projects/{id}/config", projectId)
                        .with(httpBasic(user.email(), PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();

        return readMap(result);
    }

    private void saveProjectConfig(
            TestUser user,
            long projectId,
            Map<String, Object> config
    ) throws Exception {

        mockMvc.perform(put("/api/projects/{id}/config", projectId)
                        .with(httpBasic(user.email(), PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(config)))
                .andExpect(status().isOk());
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private Map<String, Object> readMap(MvcResult result) throws Exception {
        return objectMapper.readValue(
                result.getResponse().getContentAsString(),
                MAP_TYPE
        );
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

    private String text(Object value) {
        return String.valueOf(value);
    }

    private long number(Object value) {
        return ((Number) value).longValue();
    }

    private record TestUser(
            long id,
            String email,
            String username
    ) {}
}