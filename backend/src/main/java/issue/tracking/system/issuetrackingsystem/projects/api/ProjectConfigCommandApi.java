package issue.tracking.system.issuetrackingsystem.projects.api;

public interface ProjectConfigCommandApi {
    ProjectConfigDto saveConfig(Long projectId, ProjectConfigDto config);
    ProjectTemplateDto exportTemplate(Long projectId);
    ProjectConfigDto applyTemplate(Long targetProjectId, Long sourceProjectId);
    ProjectConfigDto importTemplate(Long targetProjectId, ProjectTemplateConfigDto sourceConfig);
}
