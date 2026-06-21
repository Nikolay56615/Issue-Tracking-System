package issue.tracking.system.issuetrackingsystem;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class RemoveMemberCleanupIntegrationTest {

    private static final String PASSWORD = "Passw0rd!";

    private static final TypeReference<Map<String, Object>> MAP_TYPE =
            new TypeReference<>() {};

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void removedUserIsDeletedFromIssueAssignees() throws Exception {

        TestUser owner = register("cleanup-owner");
        TestUser worker = register("cleanup-worker");

        long projectId = createProject(owner, "Cleanup project");

        invite(owner, projectId, worker.id(), "WORKER");

        long issueId = createIssue(
                owner,
                projectId,
                "Assigned issue",
                List.of(worker.id())
        );

        removeMember(owner, projectId, worker.id());

        Map<String, Object> issue = getIssue(owner, issueId);

        List<Integer> assigneeIds = list(issue.get("assigneeIds"));

        assertThat(assigneeIds)
                .doesNotContain((int) worker.id());
    }

    @Test
    void issueMovesBacklogWhenLastAssigneeRemoved() throws Exception {

        TestUser owner = register("backlog-owner");
        TestUser worker = register("backlog-worker");

        long projectId = createProject(owner, "Backlog project");

        invite(owner, projectId, worker.id(), "WORKER");

        long issueId = createIssue(
                owner,
                projectId,
                "Backlog issue",
                List.of(worker.id())
        );

        changeIssueStatus(owner, issueId, "IN_PROGRESS", 200);

        removeMember(owner, projectId, worker.id());

        Map<String, Object> issue = getIssue(owner, issueId);

        assertThat(text(issue.get("status")))
                .isEqualTo("BACKLOG");

        assertThat(list(issue.get("assigneeIds")))
                .isEmpty();
    }

    @Test
    void removingOneAssigneeKeepsOtherAssignees() throws Exception {

        TestUser owner = register("multi-owner");
        TestUser worker1 = register("multi-worker1");
        TestUser worker2 = register("multi-worker2");

        long projectId = createProject(owner, "Multi assignee project");

        invite(owner, projectId, worker1.id(), "WORKER");
        invite(owner, projectId, worker2.id(), "WORKER");

        long issueId = createIssue(
                owner,
                projectId,
                "Multi issue",
                List.of(worker1.id(), worker2.id())
        );

        removeMember(owner, projectId, worker1.id());

        Map<String, Object> issue = getIssue(owner, issueId);

        List<Integer> assigneeIds = list(issue.get("assigneeIds"));

        assertThat(assigneeIds)
                .contains((int) worker2.id())
                .doesNotContain((int) worker1.id());

        assertThat(text(issue.get("status")))
                .isNotEqualTo("BACKLOG");
    }

    private TestUser register(String prefix) throws Exception {

        String unique = prefix + "-" + System.nanoTime();

        String email = unique + "@example.test";

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", email,
                                "username", unique,
                                "password", PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        Map<String, Object> response = readMap(result);

        return new TestUser(
                number(response.get("id")),
                email
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
                                "role", roleId
                        ))))
                .andExpect(status().isOk());
    }

    private void removeMember(
            TestUser actor,
            long projectId,
            long userId
    ) throws Exception {

        mockMvc.perform(delete("/api/projects/{id}/members/{userId}", projectId, userId)
                        .with(httpBasic(actor.email(), PASSWORD)))
                .andExpect(status().isOk());
    }

    private long createIssue(
            TestUser user,
            long projectId,
            String name,
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
                                "customFields", Map.of()
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return number(readMap(result).get("id"));
    }

    private void changeIssueStatus(
            TestUser user,
            long issueId,
            String statusValue,
            int expectedStatus
    ) throws Exception {

        mockMvc.perform(post("/api/issues/{id}/status", issueId)
                        .with(httpBasic(user.email(), PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "newStatus", statusValue
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
    private List<Integer> list(Object value) {
        return (List<Integer>) value;
    }

    private long number(Object value) {
        return ((Number) value).longValue();
    }

    private String text(Object value) {
        return String.valueOf(value);
    }

    private record TestUser(
            long id,
            String email
    ) {}
}