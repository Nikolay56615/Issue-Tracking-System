DELETE FROM issue_assignees;
DELETE FROM attachments;
DELETE FROM issues;
DELETE FROM project_configs;
DELETE FROM project_members;
DELETE FROM projects;
DELETE FROM users;

INSERT INTO users (id, email, username, password_hash, global_admin, active, created_at)
VALUES
  (1, 'owner@example.com', 'Alice Johnson', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (2, 'admin@example.com', 'Marina Petrova', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', true, true, now()),
  (3, 'developer@example.com', 'Ilya Sokolov', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (4, 'qa@example.com', 'Nina Volkova', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (5, 'qalead@example.com', 'Pavel Smirnov', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (6, 'reviewer@example.com', 'Roman Orlov', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (7, 'analyst@example.com', 'Sofia Ivanova', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (8, 'designer@example.com', 'Daria Kuznetsova', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (9, 'support@example.com', 'Mikhail Lebedev', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (10, 'devops@example.com', 'Kirill Morozov', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (11, 'product@example.com', 'Elena Fedorova', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now()),
  (12, 'intern@example.com', 'Artem Volkov', '$2a$10$JO0PHXyvRaCmubqeMy/jhOq2N89edHqIL/ZWFVVierc4mBwyr32A6', false, true, now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  global_admin = EXCLUDED.global_admin,
  active = EXCLUDED.active;

INSERT INTO projects (id, name, owner_id, created_at, is_archived)
VALUES
  (1, 'Vision QA Flow', 1, now(), false),
  (2, 'Product Delivery Template', 1, now(), false),
  (3, 'Legacy Support', 2, now(), true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  owner_id = EXCLUDED.owner_id,
  is_archived = EXCLUDED.is_archived;

DELETE FROM project_members WHERE project_id IN (1, 2, 3);

INSERT INTO project_members (id, project_id, user_id, role)
VALUES
  (1, 1, 1, 'project-1-role-owner'),
  (2, 1, 2, 'project-1-role-admin'),
  (3, 1, 3, 'project-1-role-developer'),
  (4, 1, 4, 'project-1-role-qa'),
  (5, 1, 5, 'project-1-role-qa-lead'),
  (6, 2, 1, 'project-2-role-owner'),
  (7, 2, 2, 'project-2-role-admin'),
  (8, 2, 3, 'project-2-role-engineer'),
  (9, 2, 6, 'project-2-role-reviewer'),
  (10, 2, 8, 'project-2-role-designer'),
  (11, 3, 2, 'project-3-role-owner'),
  (12, 3, 9, 'project-3-role-support')
ON CONFLICT (id) DO UPDATE SET
  project_id = EXCLUDED.project_id,
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role;

INSERT INTO project_configs (project_id, config_json, updated_at)
VALUES
  (1, $json$
{
  "roles": [
    {"id":"project-1-role-owner","projectId":1,"name":"Owner","permissions":["issue.view","issue.create","issue.edit","issue.remove","members.view","members.invite","members.remove","members.assignRole","settings.manage","project.archive","project.restore","template.export","template.apply"]},
    {"id":"project-1-role-admin","projectId":1,"name":"Admin","permissions":["issue.view","issue.create","issue.edit","issue.remove","members.view","members.invite","members.remove","members.assignRole","settings.manage","project.archive","project.restore","template.export","template.apply"]},
    {"id":"project-1-role-developer","projectId":1,"name":"Developer","permissions":["issue.view","issue.create","issue.edit"]},
    {"id":"project-1-role-qa","projectId":1,"name":"QA","permissions":["issue.view","issue.edit"]},
    {"id":"project-1-role-qa-lead","projectId":1,"name":"QA Lead","permissions":["issue.view","issue.edit","template.export"]}
  ],
  "lifecycle": {
    "transitionRulesEnabled": true,
    "statuses": [
      {"id":"project-1-status-backlog","projectId":1,"name":"Backlog","displayOrder":1,"color":"#64748b","isInitial":true},
      {"id":"project-1-status-in-progress","projectId":1,"name":"In Progress","displayOrder":2,"color":"#2563eb","isInitial":false},
      {"id":"project-1-status-review","projectId":1,"name":"Review","displayOrder":3,"color":"#a855f7","isInitial":false},
      {"id":"project-1-status-qa","projectId":1,"name":"QA","displayOrder":4,"color":"#f59e0b","isInitial":false},
      {"id":"project-1-status-done","projectId":1,"name":"Done","displayOrder":5,"color":"#16a34a","isInitial":false}
    ],
    "transitions": [
      {"id":"project-1-transition-backlog-to-in-progress","fromStatusId":"project-1-status-backlog","toStatusId":"project-1-status-in-progress","conditions":[{"type":"assignee"}]},
      {"id":"project-1-transition-in-progress-to-backlog","fromStatusId":"project-1-status-in-progress","toStatusId":"project-1-status-backlog","conditions":[{"type":"assignee"}]},
      {"id":"project-1-transition-in-progress-to-review","fromStatusId":"project-1-status-in-progress","toStatusId":"project-1-status-review","conditions":[{"type":"role","roleId":"project-1-role-developer"},{"type":"role","roleId":"project-1-role-admin"},{"type":"role","roleId":"project-1-role-owner"},{"type":"assignee"}]},
      {"id":"project-1-transition-review-to-in-progress","fromStatusId":"project-1-status-review","toStatusId":"project-1-status-in-progress","conditions":[{"type":"role","roleId":"project-1-role-developer"},{"type":"role","roleId":"project-1-role-admin"},{"type":"role","roleId":"project-1-role-owner"},{"type":"author"}]},
      {"id":"project-1-transition-review-to-qa","fromStatusId":"project-1-status-review","toStatusId":"project-1-status-qa","conditions":[{"type":"role","roleId":"project-1-role-qa-lead"},{"type":"role","roleId":"project-1-role-admin"},{"type":"role","roleId":"project-1-role-owner"}]},
      {"id":"project-1-transition-qa-to-done","fromStatusId":"project-1-status-qa","toStatusId":"project-1-status-done","conditions":[{"type":"field_user_reference","customFieldId":"project-1-field-qa-engineer"},{"type":"role","roleId":"project-1-role-qa-lead"},{"type":"role","roleId":"project-1-role-admin"},{"type":"role","roleId":"project-1-role-owner"}]},
      {"id":"project-1-transition-done-to-qa","fromStatusId":"project-1-status-done","toStatusId":"project-1-status-qa","conditions":[{"type":"role","roleId":"project-1-role-qa-lead"},{"type":"role","roleId":"project-1-role-admin"},{"type":"role","roleId":"project-1-role-owner"}]}
    ]
  },
  "customFields": [
    {"id":"project-1-field-environment","projectId":1,"name":"Environment","type":"text","required":false,"config":{"maxLength":40}},
    {"id":"project-1-field-story-points","projectId":1,"name":"Story Points","type":"number","required":false,"config":{"min":1,"max":21,"isInteger":true}},
    {"id":"project-1-field-qa-engineer","projectId":1,"name":"QA Engineer","type":"user_reference","required":true,"config":{"allowedRoleIds":["project-1-role-qa"]}},
    {"id":"project-1-field-blocked-by","projectId":1,"name":"Blocked By","type":"issue_reference","required":false,"config":{}}
  ],
  "fieldOrder": ["name","description","type","priority","assignee","author","startDate","dueDate","attachments","project-1-field-environment","project-1-field-story-points","project-1-field-qa-engineer","project-1-field-blocked-by"],
  "boardCardFieldIds": ["description","dueDate","type","priority","project-1-field-environment","project-1-field-story-points","project-1-field-qa-engineer","project-1-field-blocked-by"]
}
$json$, now()),
  (2, $json$
{
  "roles": [
    {"id":"project-2-role-owner","projectId":2,"name":"Owner","permissions":["issue.view","issue.create","issue.edit","issue.remove","members.view","members.invite","members.remove","members.assignRole","settings.manage","project.archive","project.restore","template.export","template.apply"]},
    {"id":"project-2-role-admin","projectId":2,"name":"Admin","permissions":["issue.view","issue.create","issue.edit","issue.remove","members.view","members.invite","members.remove","members.assignRole","settings.manage","project.archive","project.restore","template.export","template.apply"]},
    {"id":"project-2-role-engineer","projectId":2,"name":"Engineer","permissions":["issue.view","issue.create","issue.edit"]},
    {"id":"project-2-role-reviewer","projectId":2,"name":"Reviewer","permissions":["issue.view","issue.edit"]},
    {"id":"project-2-role-designer","projectId":2,"name":"Designer","permissions":["issue.view","issue.create","issue.edit"]}
  ],
  "lifecycle": {
    "transitionRulesEnabled": true,
    "statuses": [
      {"id":"project-2-status-discovery","projectId":2,"name":"Discovery","displayOrder":1,"color":"#0f766e","isInitial":true},
      {"id":"project-2-status-planned","projectId":2,"name":"Planned","displayOrder":2,"color":"#2563eb","isInitial":false},
      {"id":"project-2-status-build","projectId":2,"name":"Build","displayOrder":3,"color":"#9333ea","isInitial":false},
      {"id":"project-2-status-review","projectId":2,"name":"Review","displayOrder":4,"color":"#f59e0b","isInitial":false},
      {"id":"project-2-status-release","projectId":2,"name":"Release","displayOrder":5,"color":"#16a34a","isInitial":false}
    ],
    "transitions": [
      {"id":"project-2-transition-discovery-to-planned","fromStatusId":"project-2-status-discovery","toStatusId":"project-2-status-planned","conditions":[{"type":"role","roleId":"project-2-role-designer"},{"type":"role","roleId":"project-2-role-engineer"},{"type":"role","roleId":"project-2-role-admin"}]},
      {"id":"project-2-transition-planned-to-build","fromStatusId":"project-2-status-planned","toStatusId":"project-2-status-build","conditions":[{"type":"role","roleId":"project-2-role-engineer"},{"type":"role","roleId":"project-2-role-admin"},{"type":"role","roleId":"project-2-role-owner"}]},
      {"id":"project-2-transition-build-to-review","fromStatusId":"project-2-status-build","toStatusId":"project-2-status-review","conditions":[{"type":"role","roleId":"project-2-role-engineer"},{"type":"role","roleId":"project-2-role-reviewer"},{"type":"role","roleId":"project-2-role-admin"}]},
      {"id":"project-2-transition-review-to-release","fromStatusId":"project-2-status-review","toStatusId":"project-2-status-release","conditions":[{"type":"role","roleId":"project-2-role-reviewer"},{"type":"role","roleId":"project-2-role-admin"},{"type":"role","roleId":"project-2-role-owner"}]}
    ]
  },
  "customFields": [
    {"id":"project-2-field-ux-owner","projectId":2,"name":"UX Owner","type":"user_reference","required":false,"config":{"allowedRoleIds":["project-2-role-designer"]}},
    {"id":"project-2-field-estimate","projectId":2,"name":"Estimate","type":"number","required":false,"config":{"min":1,"max":40,"isInteger":true}},
    {"id":"project-2-field-release-notes","projectId":2,"name":"Release Notes","type":"text","required":false,"config":{"maxLength":140}},
    {"id":"project-2-field-release-risk","projectId":2,"name":"Release Risk","type":"enum","required":false,"config":{"options":[{"id":"low","label":"Low","color":"#16a34a"},{"id":"medium","label":"Medium","color":"#f59e0b"},{"id":"blocked","label":"Blocked","color":"#ef4444"}]}}
  ],
  "fieldOrder": ["name","description","type","priority","assignee","author","startDate","dueDate","attachments","project-2-field-ux-owner","project-2-field-estimate","project-2-field-release-notes","project-2-field-release-risk"],
  "boardCardFieldIds": ["description","dueDate","type","priority","project-2-field-ux-owner","project-2-field-estimate","project-2-field-release-notes","project-2-field-release-risk"]
}
$json$, now()),
  (3, $json$
{
  "roles": [
    {"id":"project-3-role-owner","projectId":3,"name":"Owner","permissions":["issue.view","issue.create","issue.edit","issue.remove","members.view","members.invite","members.remove","members.assignRole","settings.manage","project.archive","project.restore","template.export","template.apply"]},
    {"id":"project-3-role-support","projectId":3,"name":"Support","permissions":["issue.view","issue.edit"]}
  ],
  "lifecycle": {
    "transitionRulesEnabled": false,
    "statuses": [
      {"id":"project-3-status-backlog","projectId":3,"name":"Backlog","displayOrder":1,"color":"#64748b","isInitial":true},
      {"id":"project-3-status-in-progress","projectId":3,"name":"In Progress","displayOrder":2,"color":"#2563eb","isInitial":false},
      {"id":"project-3-status-done","projectId":3,"name":"Done","displayOrder":3,"color":"#16a34a","isInitial":false}
    ],
    "transitions": []
  },
  "customFields": [],
  "fieldOrder": ["name","description","type","priority","assignee","author","startDate","dueDate","attachments"],
  "boardCardFieldIds": ["description","dueDate","type","priority"]
}
$json$, now())
ON CONFLICT (project_id) DO UPDATE SET
  config_json = EXCLUDED.config_json,
  updated_at = EXCLUDED.updated_at;

DELETE FROM issue_assignees WHERE issue_id IN (101, 102, 103, 104, 201);
DELETE FROM attachments WHERE issue_id IN (101, 102, 103, 104, 201);

INSERT INTO issues (id, project_id, name, type, priority, status, description, author_id, start_date, due_date, custom_fields_json, deleted_at, version)
VALUES
  (101, 1, 'Implement QA transition guard', 'FEATURE', 'HIGH', 'project-1-status-backlog', 'Board should evaluate lifecycle transitions from project config.', 1, DATE '2026-04-22', DATE '2026-05-04', '{"project-1-field-environment":"Staging","project-1-field-story-points":8,"project-1-field-qa-engineer":4}', null, 0),
  (102, 1, 'Wire template export flow', 'TASK', 'MEDIUM', 'project-1-status-in-progress', 'We need to export the project config as reusable JSON.', 2, DATE '2026-04-22', DATE '2026-05-08', '{"project-1-field-environment":"Production","project-1-field-story-points":5,"project-1-field-qa-engineer":4,"project-1-field-blocked-by":101}', null, 0),
  (103, 1, 'Validate QA ownership on Done', 'BUG', 'HIGH', 'project-1-status-qa', 'Only the assigned QA engineer or QA lead should close it.', 3, DATE '2026-04-22', DATE '2026-05-10', '{"project-1-field-environment":"Preprod","project-1-field-story-points":3,"project-1-field-qa-engineer":4}', null, 0),
  (104, 1, 'Polish archived issue restore', 'TASK', 'LOW', 'project-1-status-done', 'Hidden in trash to exercise restore flow.', 1, DATE '2026-04-22', DATE '2026-05-12', '{"project-1-field-environment":"Local","project-1-field-story-points":2,"project-1-field-qa-engineer":4}', now(), 0),
  (201, 2, 'Create release checklist', 'FEATURE', 'MEDIUM', 'project-2-status-discovery', 'Template project for product delivery teams.', 1, DATE '2026-04-22', DATE '2026-05-20', '{"project-2-field-estimate":13,"project-2-field-release-notes":"Pilot release","project-2-field-ux-owner":8,"project-2-field-release-risk":"medium"}', null, 0)
ON CONFLICT (id) DO UPDATE SET
  project_id = EXCLUDED.project_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  author_id = EXCLUDED.author_id,
  start_date = EXCLUDED.start_date,
  due_date = EXCLUDED.due_date,
  custom_fields_json = EXCLUDED.custom_fields_json,
  deleted_at = EXCLUDED.deleted_at,
  version = EXCLUDED.version;

INSERT INTO issue_assignees (issue_id, assignee_id)
VALUES
  (101, 3),
  (102, 3),
  (103, 4),
  (104, 5),
  (201, 6);

SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT max(id) FROM users));
SELECT setval(pg_get_serial_sequence('projects', 'id'), (SELECT max(id) FROM projects));
SELECT setval(pg_get_serial_sequence('project_members', 'id'), (SELECT max(id) FROM project_members));
SELECT setval(pg_get_serial_sequence('issues', 'id'), (SELECT max(id) FROM issues));
