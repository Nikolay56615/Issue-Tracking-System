package issue.tracking.system.issuetrackingsystem;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional // Откатывает все изменения в БД после каждого теста
public abstract class BaseIntegrationTest {
    // Базовый класс для всех интеграционных тестов
}