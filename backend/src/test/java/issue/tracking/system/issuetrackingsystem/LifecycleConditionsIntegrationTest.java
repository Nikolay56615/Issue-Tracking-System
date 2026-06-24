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
    void basicGraphTransitionsWorkCorrectly() throws Exception {
        // Проверяем базовые переходы по графу
        TestUser owner = register("graph-owner");
        TestUser worker = register("graph-worker");

        long projectId = createProject(owner, "Graph transitions");
        invite(owner, projectId, worker.id(), "WORKER");

        long issueId = createIssue(
                owner,
                projectId,
                "Graph issue",
                Map.of(),
                List.of(worker.id())
        );

        // BACKLOG -> IN_PROGRESS (разрешено графом + worker как assignee)
        changeIssueStatus(worker, issueId, "IN_PROGRESS", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("IN_PROGRESS");

        // IN_PROGRESS -> REVIEW (разрешено графом + worker как assignee)
        changeIssueStatus(worker, issueId, "REVIEW", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("REVIEW");

        // REVIEW -> DONE (разрешено графом + owner как привилегированная роль)
        changeIssueStatus(owner, issueId, "DONE", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("DONE");

        // DONE -> BACKLOG (разрешено графом + owner как привилегированная роль)
        changeIssueStatus(owner, issueId, "BACKLOG", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("BACKLOG");
    }

    @Test
    void invalidGraphTransitionsAreRejected() throws Exception {
        // Проверяем, что запрещенные графом переходы не работают
        TestUser owner = register("invalid-graph-owner");

        long projectId = createProject(owner, "Invalid graph");

        long issueId = createIssue(
                owner,
                projectId,
                "Invalid graph issue",
                Map.of(),
                List.of()
        );

        // BACKLOG -> DONE (запрещено графом)
        changeIssueStatus(owner, issueId, "DONE", 401);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("BACKLOG");

        // BACKLOG -> REVIEW (запрещено графом)
        changeIssueStatus(owner, issueId, "REVIEW", 401);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("BACKLOG");

        // Переводим в IN_PROGRESS
        changeIssueStatus(owner, issueId, "IN_PROGRESS", 200);

        // IN_PROGRESS -> DONE (запрещено, только через REVIEW)
        changeIssueStatus(owner, issueId, "DONE", 401);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("IN_PROGRESS");
    }

    @Test
    void roleBasedTransitionsWorkCorrectly() throws Exception {
        // Проверяем ролевые ограничения
        TestUser owner = register("role-owner");
        TestUser worker = register("role-worker");
        TestUser reviewer = register("role-reviewer");

        long projectId = createProject(owner, "Role transitions");
        invite(owner, projectId, worker.id(), "WORKER");
        invite(owner, projectId, reviewer.id(), "REVIEWER");

        long issueId = createIssue(
                owner,
                projectId,
                "Role issue",
                Map.of(),
                List.of(worker.id())
        );

        // WORKER может BACKLOG -> IN_PROGRESS (как assignee)
        changeIssueStatus(worker, issueId, "IN_PROGRESS", 200);

        // WORKER может IN_PROGRESS -> REVIEW (как assignee)
        changeIssueStatus(worker, issueId, "REVIEW", 200);

        // WORKER НЕ может REVIEW -> DONE (только REVIEWER/ADMIN/OWNER)
        changeIssueStatus(worker, issueId, "DONE", 401);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("REVIEW");

        // REVIEWER может REVIEW -> DONE
        changeIssueStatus(reviewer, issueId, "DONE", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("DONE");

        // OWNER может делать любые переходы
        changeIssueStatus(owner, issueId, "BACKLOG", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("BACKLOG");
    }

    @Test
    void workerCannotTransitionWithoutBeingAssignee() throws Exception {
        // Проверяем, что WORKER не может переводить задачу, если не является assignee
        TestUser owner = register("no-assignee-owner");
        TestUser worker1 = register("no-assignee-worker1");
        TestUser worker2 = register("no-assignee-worker2");

        long projectId = createProject(owner, "No assignee");
        invite(owner, projectId, worker1.id(), "WORKER");
        invite(owner, projectId, worker2.id(), "WORKER");

        // Создаем задачу БЕЗ assignee
        long issueId = createIssue(
                owner,
                projectId,
                "No assignee issue",
                Map.of(),
                List.of() // Пустой список assignee
        );

        // worker1 пытается перевести BACKLOG -> IN_PROGRESS (должно упасть, т.к. не assignee)
        changeIssueStatus(worker1, issueId, "IN_PROGRESS", 401);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("BACKLOG");

        // Назначаем worker1 как assignee
        updateIssueAssignees(owner, issueId, List.of(worker1.id()));

        // Теперь worker1 может перевести
        changeIssueStatus(worker1, issueId, "IN_PROGRESS", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("IN_PROGRESS");

        // worker2 НЕ может перевести IN_PROGRESS -> REVIEW (не assignee)
        changeIssueStatus(worker2, issueId, "REVIEW", 401);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("IN_PROGRESS");
    }

    @Test
    void authorCanCancelIssueFromInProgress() throws Exception {
        // Проверяем, что автор может отменить задачу (вернуть в BACKLOG)
        TestUser owner = register("cancel-owner");
        TestUser author = register("cancel-author");
        TestUser worker = register("cancel-worker");

        long projectId = createProject(owner, "Cancel issue");
        invite(owner, projectId, author.id(), "WORKER");
        invite(owner, projectId, worker.id(), "WORKER");

        long issueId = createIssue(
                author,
                projectId,
                "Cancel issue",
                Map.of(),
                List.of(worker.id())
        );

        // Переводим в IN_PROGRESS
        changeIssueStatus(worker, issueId, "IN_PROGRESS", 200);

        // Author может вернуть IN_PROGRESS -> BACKLOG
        changeIssueStatus(author, issueId, "BACKLOG", 200);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("BACKLOG");

        // Worker (не author) НЕ может вернуть IN_PROGRESS -> BACKLOG
        changeIssueStatus(worker, issueId, "IN_PROGRESS", 200);
        changeIssueStatus(worker, issueId, "BACKLOG", 401);
        assertThat(text(getIssue(owner, issueId).get("status"))).isEqualTo("IN_PROGRESS");
    }

    // Добавьте этот хелпер-метод для обновления assignee
    private void updateIssueAssignees(
            TestUser user,
            long issueId,
            List<Long> assigneeIds
    ) throws Exception {

        Map<String, Object> issue = getIssue(user, issueId);

        mockMvc.perform(put("/api/issues/{id}", issueId)
                        .with(httpBasic(user.email(), PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "name", text(issue.get("name")),
                                "description", text(issue.get("description")),
                                "priority", text(issue.get("priority")),
                                "type", text(issue.get("type")),
                                "status", text(issue.get("status")),
                                "assigneeIds", assigneeIds,
                                "attachments", list(issue.get("attachments"))
                        ))))
                .andExpect(status().isOk());
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
            String role
    ) throws Exception {

        mockMvc.perform(post("/api/projects/{id}/invite", projectId)
                        .with(httpBasic(actor.email(), PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "userId", userId,
                                "role", role
                        ))))
                .andExpect(status().isOk());
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