package issue.tracking.system.issuetrackingsystem;

import static org.assertj.core.api.Assertions.assertThat;

import issue.tracking.system.issuetrackingsystem.issue.internal.Issue;
import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectConfigEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Lob;
import org.junit.jupiter.api.Test;

class PersistenceMappingTest {

    @Test
    void jsonTextFieldsAreStoredAsPlainTextColumns() throws Exception {
        assertPlainTextColumn(ProjectConfigEntity.class, "configJson");
        assertPlainTextColumn(Issue.class, "customFieldsJson");
    }

    private void assertPlainTextColumn(Class<?> entityType, String fieldName) throws Exception {
        var field = entityType.getDeclaredField(fieldName);

        assertThat(field.getAnnotation(Lob.class))
            .as("%s.%s must not use @Lob because PostgreSQL stores String LOBs as OIDs", entityType.getSimpleName(), fieldName)
            .isNull();
        assertThat(field.getAnnotation(Column.class))
            .extracting(Column::columnDefinition)
            .isEqualTo("TEXT");
    }
}
