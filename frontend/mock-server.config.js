const today = '2026-04-22';

const PERMISSION_KEYS = [
  'issue.view',
  'issue.create',
  'issue.edit',
  'issue.remove',
  'members.invite',
  'members.remove',
  'members.assignRole',
  'settings.manage',
  'project.archive',
  'project.restore',
  'template.export',
  'template.apply',
];

const users = [
  {
    id: 1,
    email: 'owner@example.com',
    username: 'Alice Johnson',
    password: 'password',
  },
  {
    id: 2,
    email: 'admin@example.com',
    username: 'Marina Petrova',
    password: 'password',
  },
  {
    id: 3,
    email: 'developer@example.com',
    username: 'Ilya Sokolov',
    password: 'password',
  },
  {
    id: 4,
    email: 'qa@example.com',
    username: 'Nina Volkova',
    password: 'password',
  },
  {
    id: 5,
    email: 'qalead@example.com',
    username: 'Pavel Smirnov',
    password: 'password',
  },
  {
    id: 6,
    email: 'reviewer@example.com',
    username: 'Roman Orlov',
    password: 'password',
  },
  {
    id: 7,
    email: 'analyst@example.com',
    username: 'Sofia Ivanova',
    password: 'password',
  },
  {
    id: 8,
    email: 'designer@example.com',
    username: 'Daria Kuznetsova',
    password: 'password',
  },
  {
    id: 9,
    email: 'support@example.com',
    username: 'Mikhail Lebedev',
    password: 'password',
  },
  {
    id: 10,
    email: 'devops@example.com',
    username: 'Kirill Morozov',
    password: 'password',
  },
  {
    id: 11,
    email: 'product@example.com',
    username: 'Elena Fedorova',
    password: 'password',
  },
  {
    id: 12,
    email: 'intern@example.com',
    username: 'Artem Volkov',
    password: 'password',
  },
];

const projects = [
  {
    id: 1,
    name: 'Vision QA Flow',
    ownerId: 1,
    archived: false,
  },
  {
    id: 2,
    name: 'Product Delivery Template',
    ownerId: 1,
    archived: false,
  },
  {
    id: 3,
    name: 'Legacy Support',
    ownerId: 2,
    archived: true,
  },
];

const members = [
  { projectId: 1, userId: 1, roleId: 'project-1-role-owner' },
  { projectId: 1, userId: 2, roleId: 'project-1-role-admin' },
  { projectId: 1, userId: 3, roleId: 'project-1-role-developer' },
  { projectId: 1, userId: 4, roleId: 'project-1-role-qa' },
  { projectId: 1, userId: 5, roleId: 'project-1-role-qa-lead' },
  { projectId: 2, userId: 1, roleId: 'project-2-role-owner' },
  { projectId: 2, userId: 2, roleId: 'project-2-role-admin' },
  { projectId: 2, userId: 3, roleId: 'project-2-role-engineer' },
  { projectId: 2, userId: 6, roleId: 'project-2-role-reviewer' },
  { projectId: 3, userId: 2, roleId: 'project-3-role-owner' },
  { projectId: 3, userId: 6, roleId: 'project-3-role-support' },
];

const counters = {
  project: Math.max(...projects.map((project) => project.id)) + 1,
  issue: 200,
  attachment: 1,
};

const slugify = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

const createRole = (projectId, slug, name, permissions) => ({
  id: `project-${projectId}-role-${slug}`,
  projectId,
  name,
  permissions: [...permissions],
});

const createStatus = (projectId, slug, name, displayOrder, color, isInitial = false) => ({
  id: `project-${projectId}-status-${slug}`,
  projectId,
  name,
  displayOrder,
  color,
  ...(isInitial ? { isInitial } : {}),
});

const createField = (projectId, slug, name, type, required, config) => ({
  id: `project-${projectId}-field-${slug}`,
  projectId,
  name,
  type,
  required,
  config: structuredClone(config),
});

const SYSTEM_FIELD_IDS = [
  'name',
  'description',
  'type',
  'priority',
  'assignee',
  'author',
  'startDate',
  'dueDate',
  'attachments',
];

const createFieldOrder = (customFields) => [
  ...SYSTEM_FIELD_IDS,
  ...customFields.map((field) => field.id),
];

const createTransition = (projectId, slug, fromStatusId, toStatusId, conditions) => ({
  id: `project-${projectId}-transition-${slug}`,
  fromStatusId,
  toStatusId,
  conditions: structuredClone(conditions),
});

const createDefaultProjectConfig = (projectId) => {
  const owner = createRole(projectId, 'owner', 'Owner', PERMISSION_KEYS);
  const admin = createRole(projectId, 'admin', 'Admin', [
    'issue.view',
    'issue.create',
    'issue.edit',
    'issue.remove',
    'members.invite',
    'members.remove',
    'members.assignRole',
    'settings.manage',
    'project.archive',
    'project.restore',
    'template.export',
    'template.apply',
  ]);
  const worker = createRole(projectId, 'worker', 'Worker', [
    'issue.view',
    'issue.create',
    'issue.edit',
  ]);
  const reviewer = createRole(projectId, 'reviewer', 'Reviewer', [
    'issue.view',
    'issue.edit',
  ]);

  const backlog = createStatus(projectId, 'backlog', 'Backlog', 1, '#64748b', true);
  const inProgress = createStatus(
    projectId,
    'in-progress',
    'In Progress',
    2,
    '#2563eb'
  );
  const review = createStatus(projectId, 'review', 'Review', 3, '#f59e0b');
  const done = createStatus(projectId, 'done', 'Done', 4, '#16a34a');

  return {
    projectId,
    roles: [owner, admin, worker, reviewer],
    lifecycle: {
      transitionRulesEnabled: true,
      statuses: [backlog, inProgress, review, done],
      transitions: [
        createTransition(projectId, 'backlog-to-in-progress', backlog.id, inProgress.id, [
          { type: 'role', roleId: worker.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
          { type: 'author' },
          { type: 'assignee' },
        ]),
        createTransition(projectId, 'in-progress-to-review', inProgress.id, review.id, [
          { type: 'role', roleId: worker.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
          { type: 'assignee' },
        ]),
        createTransition(projectId, 'review-to-done', review.id, done.id, [
          { type: 'role', roleId: reviewer.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
        ]),
        createTransition(projectId, 'review-to-in-progress', review.id, inProgress.id, [
          { type: 'role', roleId: reviewer.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
        ]),
      ],
    },
    customFields: [],
    fieldOrder: createFieldOrder([]),
    updatedAt: new Date().toISOString(),
  };
};

const createQaVisionProjectConfig = (projectId) => {
  const owner = createRole(projectId, 'owner', 'Owner', PERMISSION_KEYS);
  const admin = createRole(projectId, 'admin', 'Admin', [
    'issue.view',
    'issue.create',
    'issue.edit',
    'issue.remove',
    'members.invite',
    'members.remove',
    'members.assignRole',
    'settings.manage',
    'project.archive',
    'project.restore',
    'template.export',
    'template.apply',
  ]);
  const developer = createRole(projectId, 'developer', 'Developer', [
    'issue.view',
    'issue.create',
    'issue.edit',
  ]);
  const qa = createRole(projectId, 'qa', 'QA', ['issue.view', 'issue.edit']);
  const qaLead = createRole(projectId, 'qa-lead', 'QA Lead', [
    'issue.view',
    'issue.edit',
    'template.export',
  ]);

  const backlog = createStatus(projectId, 'backlog', 'Backlog', 1, '#64748b', true);
  const inProgress = createStatus(
    projectId,
    'in-progress',
    'In Progress',
    2,
    '#2563eb'
  );
  const review = createStatus(projectId, 'review', 'Review', 3, '#a855f7');
  const qaStatus = createStatus(projectId, 'qa', 'QA', 4, '#f59e0b');
  const done = createStatus(projectId, 'done', 'Done', 5, '#16a34a');

  const environment = createField(projectId, 'environment', 'Environment', 'text', false, {
    maxLength: 40,
  });
  const storyPoints = createField(projectId, 'story-points', 'Story Points', 'number', false, {
    min: 1,
    max: 21,
    isInteger: true,
  });
  const qaEngineer = createField(projectId, 'qa-engineer', 'QA Engineer', 'user_reference', true, {
    allowedRoleIds: [qa.id],
  });
  const blockedBy = createField(projectId, 'blocked-by', 'Blocked By', 'issue_reference', false, {});

  return {
    projectId,
    roles: [owner, admin, developer, qa, qaLead],
    lifecycle: {
      transitionRulesEnabled: true,
      statuses: [backlog, inProgress, review, qaStatus, done],
      transitions: [
        createTransition(projectId, 'backlog-to-in-progress', backlog.id, inProgress.id, [
          { type: 'role', roleId: developer.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
          { type: 'author' },
          { type: 'assignee' },
        ]),
        createTransition(projectId, 'in-progress-to-review', inProgress.id, review.id, [
          { type: 'role', roleId: developer.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
          { type: 'assignee' },
        ]),
        createTransition(projectId, 'review-to-in-progress', review.id, inProgress.id, [
          { type: 'role', roleId: developer.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
          { type: 'author' },
        ]),
        createTransition(projectId, 'review-to-qa', review.id, qaStatus.id, [
          { type: 'role', roleId: qaLead.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
        ]),
        createTransition(projectId, 'qa-to-done', qaStatus.id, done.id, [
          { type: 'field_user_reference', customFieldId: qaEngineer.id },
          { type: 'role', roleId: qaLead.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
        ]),
        createTransition(projectId, 'done-to-qa', done.id, qaStatus.id, [
          { type: 'role', roleId: qaLead.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
        ]),
      ],
    },
    customFields: [environment, storyPoints, qaEngineer, blockedBy],
    fieldOrder: createFieldOrder([environment, storyPoints, qaEngineer, blockedBy]),
    updatedAt: new Date().toISOString(),
  };
};

const createProductTemplateConfig = (projectId) => {
  const config = createDefaultProjectConfig(projectId);
  const owner = config.roles.find((role) => role.name === 'Owner');
  const admin = config.roles.find((role) => role.name === 'Admin');
  const worker = createRole(projectId, 'engineer', 'Engineer', [
    'issue.view',
    'issue.create',
    'issue.edit',
  ]);
  const reviewer = createRole(projectId, 'reviewer', 'Reviewer', [
    'issue.view',
    'issue.edit',
  ]);
  const designer = createRole(projectId, 'designer', 'Designer', [
    'issue.view',
    'issue.create',
    'issue.edit',
  ]);

  const discovery = createStatus(projectId, 'discovery', 'Discovery', 1, '#0f766e', true);
  const planned = createStatus(projectId, 'planned', 'Planned', 2, '#2563eb');
  const build = createStatus(projectId, 'build', 'Build', 3, '#9333ea');
  const review = createStatus(projectId, 'review', 'Review', 4, '#f59e0b');
  const release = createStatus(projectId, 'release', 'Release', 5, '#16a34a');

  const uxOwner = createField(projectId, 'ux-owner', 'UX Owner', 'user_reference', false, {
    allowedRoleIds: [designer.id],
  });
  const estimate = createField(projectId, 'estimate', 'Estimate', 'number', false, {
    min: 1,
    max: 40,
    isInteger: true,
  });
  const releaseNotes = createField(projectId, 'release-notes', 'Release Notes', 'text', false, {
    maxLength: 140,
  });

  return {
    projectId,
    roles: [owner, admin, worker, reviewer, designer].filter(Boolean),
    lifecycle: {
      transitionRulesEnabled: true,
      statuses: [discovery, planned, build, review, release],
      transitions: [
        createTransition(projectId, 'discovery-to-planned', discovery.id, planned.id, [
          { type: 'role', roleId: designer.id },
          { type: 'role', roleId: worker.id },
          { type: 'role', roleId: admin.id },
        ]),
        createTransition(projectId, 'planned-to-build', planned.id, build.id, [
          { type: 'role', roleId: worker.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
        ]),
        createTransition(projectId, 'build-to-review', build.id, review.id, [
          { type: 'role', roleId: worker.id },
          { type: 'role', roleId: reviewer.id },
          { type: 'role', roleId: admin.id },
        ]),
        createTransition(projectId, 'review-to-release', review.id, release.id, [
          { type: 'role', roleId: reviewer.id },
          { type: 'role', roleId: admin.id },
          { type: 'role', roleId: owner.id },
        ]),
      ],
    },
    customFields: [uxOwner, estimate, releaseNotes],
    fieldOrder: createFieldOrder([uxOwner, estimate, releaseNotes]),
    updatedAt: new Date().toISOString(),
  };
};

const configProject1 = createQaVisionProjectConfig(1);
const configProject2 = createProductTemplateConfig(2);
const configProject3 = createDefaultProjectConfig(3);

const projectConfigs = new Map([
  [1, configProject1],
  [2, configProject2],
  [3, configProject3],
]);

const project1Fields = Object.fromEntries(
  configProject1.customFields.map((field) => [field.name, field.id])
);
const project1Statuses = Object.fromEntries(
  configProject1.lifecycle.statuses.map((status) => [status.name, status.id])
);

const project2Fields = Object.fromEntries(
  configProject2.customFields.map((field) => [field.name, field.id])
);
const project2Statuses = Object.fromEntries(
  configProject2.lifecycle.statuses.map((status) => [status.name, status.id])
);

const issues = [
  {
    id: 101,
    projectId: 1,
    name: 'Implement QA transition guard',
    type: 'FEATURE',
    priority: 'HIGH',
    status: project1Statuses.Backlog,
    description: 'Board should evaluate lifecycle transitions from project config.',
    assigneeIds: [3],
    authorId: 1,
    startDate: today,
    dueDate: '2026-05-04',
    attachments: [],
    customFields: {
      [project1Fields.Environment]: 'Staging',
      [project1Fields['Story Points']]: 8,
      [project1Fields['QA Engineer']]: 4,
    },
  },
  {
    id: 102,
    projectId: 1,
    name: 'Wire template export flow',
    type: 'TASK',
    priority: 'MEDIUM',
    status: project1Statuses['In Progress'],
    description: 'We need to export the project config as reusable JSON.',
    assigneeIds: [3],
    authorId: 2,
    startDate: today,
    dueDate: '2026-05-08',
    attachments: [],
    customFields: {
      [project1Fields.Environment]: 'Production',
      [project1Fields['Story Points']]: 5,
      [project1Fields['QA Engineer']]: 4,
      [project1Fields['Blocked By']]: 101,
    },
  },
  {
    id: 103,
    projectId: 1,
    name: 'Validate QA ownership on Done',
    type: 'BUG',
    priority: 'HIGH',
    status: project1Statuses.QA,
    description: 'Only the assigned QA engineer or QA lead should close it.',
    assigneeIds: [4],
    authorId: 3,
    startDate: today,
    dueDate: '2026-05-10',
    attachments: [],
    customFields: {
      [project1Fields.Environment]: 'Preprod',
      [project1Fields['Story Points']]: 3,
      [project1Fields['QA Engineer']]: 4,
    },
  },
  {
    id: 104,
    projectId: 1,
    name: 'Polish archived issue restore',
    type: 'TASK',
    priority: 'LOW',
    status: project1Statuses.Done,
    description: 'Hidden in trash to exercise restore flow.',
    assigneeIds: [5],
    authorId: 1,
    startDate: today,
    dueDate: '2026-05-12',
    attachments: [],
    customFields: {
      [project1Fields.Environment]: 'Local',
      [project1Fields['Story Points']]: 2,
      [project1Fields['QA Engineer']]: 4,
    },
  },
  {
    id: 201,
    projectId: 2,
    name: 'Create release checklist',
    type: 'FEATURE',
    priority: 'MEDIUM',
    status: project2Statuses.Discovery,
    description: 'Template project for product delivery teams.',
    assigneeIds: [6],
    authorId: 1,
    startDate: today,
    dueDate: '2026-05-20',
    attachments: [],
    customFields: {
      [project2Fields['Estimate']]: 13,
      [project2Fields['Release Notes']]: 'Pilot release',
      [project2Fields['UX Owner']]: 6,
    },
  },
];

const deletedIssueIds = new Set([104]);

const ok = (body = {}) => ({ statusCode: 200, body });
const error = (statusCode, message) => ({ statusCode, body: { message } });

const getId = (request, name = 'id') => Number(request.params[name]);

const getCurrentUser = (request) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Basic ')) return null;

  const token = authorization.slice('Basic '.length);
  const decoded = Buffer.from(token, 'base64').toString('utf8');
  const [email, password] = decoded.split(':');

  return (
    users.find((user) => user.email === email && user.password === password) ??
    null
  );
};

const requireUser = (request) => {
  const user = getCurrentUser(request);
  if (!user) return { user: null, response: error(401, 'Unauthorized') };

  return { user, response: null };
};

const getProject = (projectId) =>
  projects.find((project) => project.id === projectId) ?? null;

const getConfig = (projectId) => projectConfigs.get(projectId) ?? null;

const getUserById = (userId) => users.find((user) => user.id === userId) ?? null;

const getProjectMembers = (projectId) =>
  members.filter((member) => member.projectId === projectId);

const getMember = (projectId, userId) =>
  members.find(
    (member) => member.projectId === projectId && member.userId === userId
  ) ?? null;

const getRole = (config, roleId) =>
  config?.roles.find((role) => role.id === roleId) ?? null;

const hasPermission = (role, permission) =>
  Boolean(role?.permissions.includes(permission));

const ensureProjectAccess = (request, projectId, permission = null) => {
  const { user, response } = requireUser(request);
  if (response) {
    return { response };
  }

  const project = getProject(projectId);
  if (!project) {
    return { response: error(404, 'Project not found') };
  }

  const config = getConfig(projectId);
  if (!config) {
    return { response: error(404, 'Project config not found') };
  }

  const member = getMember(projectId, user.id);
  if (!member) {
    return { response: error(403, 'No project access') };
  }

  const role = getRole(config, member.roleId);
  if (!role) {
    return { response: error(409, 'Project member role is invalid') };
  }

  if (permission && !hasPermission(role, permission)) {
    return { response: error(403, 'Insufficient permissions') };
  }

  return { user, project, config, member, role, response: null };
};

const toProfile = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
});

const toProject = (project) => ({
  id: project.id,
  name: project.name,
  ownerId: project.ownerId,
  archived: project.archived,
});

const toMemberProfile = (projectId, member) => {
  const user = getUserById(member.userId);
  const config = getConfig(projectId);
  const role = getRole(config, member.roleId);

  return {
    id: user.id,
    email: user.email,
    name: user.username,
    roleId: member.roleId,
    roleName: role?.name ?? 'Unknown',
    permissions: role?.permissions ?? [],
  };
};

const getInitialStatusId = (config) => {
  const initialStatus =
    config.lifecycle.statuses.find((status) => status.isInitial) ??
    [...config.lifecycle.statuses].sort(
      (left, right) => left.displayOrder - right.displayOrder
    )[0];

  return initialStatus?.id ?? null;
};

const normalizeTemplateConfig = (config) => ({
  roles: config.roles.map((role) => structuredClone(role)),
  lifecycle: {
    transitionRulesEnabled: config.lifecycle.transitionRulesEnabled !== false,
    statuses: config.lifecycle.statuses.map((status) => structuredClone(status)),
    transitions: config.lifecycle.transitions.map((transition) =>
      structuredClone(transition)
    ),
  },
  customFields: config.customFields.map((field) => structuredClone(field)),
  fieldOrder: [...(config.fieldOrder ?? createFieldOrder(config.customFields))],
});

const cloneConfigForProject = (projectId, templateConfig) => {
  const roleIdMap = new Map();
  const roles = templateConfig.roles.map((role, index) => {
    const id = `project-${projectId}-role-${slugify(role.name || `role-${index + 1}`)}`;
    roleIdMap.set(role.id, id);

    return {
      id,
      projectId,
      name: role.name,
      permissions: [...role.permissions],
    };
  });

  const statusIdMap = new Map();
  const statuses = templateConfig.lifecycle.statuses.map((status, index) => {
    const id = `project-${projectId}-status-${slugify(status.name || `status-${index + 1}`)}`;
    statusIdMap.set(status.id, id);

    return {
      id,
      projectId,
      name: status.name,
      displayOrder: status.displayOrder,
      color: status.color,
      ...(status.isInitial ? { isInitial: true } : {}),
    };
  });

  const fieldIdMap = new Map();
  const customFields = templateConfig.customFields.map((field, index) => {
    const id = `project-${projectId}-field-${slugify(field.name || `field-${index + 1}`)}`;
    fieldIdMap.set(field.id, id);

    if (field.type === 'text') {
      return {
        id,
        projectId,
        name: field.name,
        type: 'text',
        required: field.required,
        config: {
          ...(field.config.maxLength != null
            ? { maxLength: field.config.maxLength }
            : {}),
        },
      };
    }

    if (field.type === 'number') {
      return {
        id,
        projectId,
        name: field.name,
        type: 'number',
        required: field.required,
        config: {
          ...(field.config.min != null ? { min: field.config.min } : {}),
          ...(field.config.max != null ? { max: field.config.max } : {}),
          ...(field.config.isInteger ? { isInteger: true } : {}),
        },
      };
    }

    if (field.type === 'user_reference') {
      return {
        id,
        projectId,
        name: field.name,
        type: 'user_reference',
        required: field.required,
        config: {
          allowedRoleIds: field.config.allowedRoleIds
            .map((roleId) => roleIdMap.get(roleId))
            .filter(Boolean),
        },
      };
    }

    return {
      id,
      projectId,
      name: field.name,
      type: 'issue_reference',
      required: field.required,
      config: {},
    };
  });

  const fieldOrder = (templateConfig.fieldOrder ?? createFieldOrder(templateConfig.customFields))
    .map((fieldId) => fieldIdMap.get(fieldId) ?? fieldId)
    .filter(
      (fieldId, index, array) =>
        array.indexOf(fieldId) === index &&
        (SYSTEM_FIELD_IDS.includes(fieldId) || customFields.some((field) => field.id === fieldId))
    );

  const transitions = templateConfig.lifecycle.transitions.map(
    (transition, index) => ({
      id: `project-${projectId}-transition-${slugify(transition.id || `transition-${index + 1}`)}`,
      fromStatusId:
        statusIdMap.get(transition.fromStatusId) ?? transition.fromStatusId,
      toStatusId: statusIdMap.get(transition.toStatusId) ?? transition.toStatusId,
      conditions: transition.conditions.map((condition) => {
        if (condition.type === 'role') {
          return {
            type: 'role',
            roleId: roleIdMap.get(condition.roleId) ?? condition.roleId,
          };
        }

        if (condition.type === 'field_user_reference') {
          return {
            type: 'field_user_reference',
            customFieldId:
              fieldIdMap.get(condition.customFieldId) ?? condition.customFieldId,
          };
        }

        return structuredClone(condition);
      }),
    })
  );

  return {
    projectId,
    roles,
    lifecycle: {
      transitionRulesEnabled:
        templateConfig.lifecycle.transitionRulesEnabled !== false,
      statuses,
      transitions,
    },
    customFields,
    fieldOrder,
    updatedAt: new Date().toISOString(),
  };
};

const getRoleByName = (config, name) =>
  config.roles.find((role) => role.name.trim().toLowerCase() === name.trim().toLowerCase()) ??
  null;

const remapMembersToConfig = (projectId, previousConfig, nextConfig) => {
  const ownerRole =
    getRoleByName(nextConfig, 'Owner') ??
    nextConfig.roles.find((role) => hasPermission(role, 'settings.manage')) ??
    nextConfig.roles[0];
  const managerRole =
    getRoleByName(nextConfig, 'Admin') ??
    nextConfig.roles.find((role) => hasPermission(role, 'members.assignRole')) ??
    ownerRole;
  const contributorRole =
    nextConfig.roles.find(
      (role) =>
        hasPermission(role, 'issue.create') &&
        hasPermission(role, 'issue.edit') &&
        !hasPermission(role, 'settings.manage') &&
        !hasPermission(role, 'members.assignRole')
    ) ??
    nextConfig.roles.find(
      (role) =>
        hasPermission(role, 'issue.edit') &&
        !hasPermission(role, 'settings.manage')
    ) ??
    nextConfig.roles.find(
      (role) => role.id !== ownerRole.id && role.id !== managerRole.id
    ) ??
    managerRole;
  const viewerRole =
    nextConfig.roles.find(
      (role) =>
        hasPermission(role, 'issue.view') &&
        !hasPermission(role, 'issue.create') &&
        !hasPermission(role, 'settings.manage')
    ) ?? contributorRole;

  getProjectMembers(projectId).forEach((member) => {
    const previousRole = getRole(previousConfig, member.roleId);
    const mappedRoleByName = previousRole
      ? getRoleByName(nextConfig, previousRole.name)
      : null;

    const mappedRole =
      mappedRoleByName ??
      (member.userId === getProject(projectId)?.ownerId
        ? ownerRole
        : previousRole &&
            (hasPermission(previousRole, 'settings.manage') ||
              hasPermission(previousRole, 'members.assignRole'))
          ? managerRole
          : previousRole &&
              (hasPermission(previousRole, 'issue.create') ||
                hasPermission(previousRole, 'issue.edit'))
            ? contributorRole
            : viewerRole);

    member.roleId = mappedRole.id;
  });
};

const validateCustomFieldValue = (projectId, config, field, value, issueId = null) => {
  if (value === undefined || value === null || value === '') {
    if (field.required) {
      return `${field.name} is required`;
    }

    return null;
  }

  if (field.type === 'text') {
    if (typeof value !== 'string') {
      return `${field.name} must be text`;
    }
    if (field.config.maxLength && value.length > field.config.maxLength) {
      return `${field.name} exceeds max length`;
    }
    return null;
  }

  if (field.type === 'number') {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numericValue)) {
      return `${field.name} must be a number`;
    }
    if (field.config.isInteger && !Number.isInteger(numericValue)) {
      return `${field.name} must be an integer`;
    }
    if (field.config.min != null && numericValue < field.config.min) {
      return `${field.name} is below minimum`;
    }
    if (field.config.max != null && numericValue > field.config.max) {
      return `${field.name} is above maximum`;
    }
    return null;
  }

  if (field.type === 'user_reference') {
    const memberId = Number(value);
    const member = getMember(projectId, memberId);
    if (!member) {
      return `${field.name} references a member outside the project`;
    }
    if (
      field.config.allowedRoleIds.length > 0 &&
      !field.config.allowedRoleIds.includes(member.roleId)
    ) {
      return `${field.name} references a member with an invalid role`;
    }
    return null;
  }

  const referencedIssueId = Number(value);
  const referencedIssue = issues.find(
    (issue) =>
      issue.id === referencedIssueId &&
      issue.projectId === projectId &&
      !deletedIssueIds.has(issue.id)
  );
  if (!referencedIssue) {
    return `${field.name} references an issue outside the project`;
  }
  if (issueId != null && referencedIssue.id === issueId) {
    return `${field.name} cannot reference the issue itself`;
  }

  return null;
};

const sanitizeCustomFields = (projectId, config, values, issueId = null) => {
  const sanitized = {};

  for (const field of config.customFields) {
    const value = values?.[field.id];
    const fieldError = validateCustomFieldValue(
      projectId,
      config,
      field,
      value,
      issueId
    );
    if (fieldError) {
      return { error: fieldError, sanitized: null };
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (field.type === 'number') {
      sanitized[field.id] = typeof value === 'number' ? value : Number(value);
      continue;
    }

    if (field.type === 'user_reference' || field.type === 'issue_reference') {
      sanitized[field.id] = Number(value);
      continue;
    }

    sanitized[field.id] = value;
  }

  return { error: null, sanitized };
};

const remapIssuesToConfig = (projectId, previousConfig, nextConfig) => {
  const previousStatusesByName = new Map(
    previousConfig.lifecycle.statuses.map((status) => [
      status.name.trim().toLowerCase(),
      status.id,
    ])
  );
  const nextStatusesByName = new Map(
    nextConfig.lifecycle.statuses.map((status) => [
      status.name.trim().toLowerCase(),
      status.id,
    ])
  );
  const nextInitialStatusId = getInitialStatusId(nextConfig);
  const previousFieldsByKey = new Map(
    previousConfig.customFields.map((field) => [
      `${field.type}:${field.name.trim().toLowerCase()}`,
      field,
    ])
  );

  issues
    .filter(
      (issue) => issue.projectId === projectId && !deletedIssueIds.has(issue.id)
    )
    .forEach((issue) => {
      const previousStatusName = previousConfig.lifecycle.statuses.find(
        (status) => status.id === issue.status
      )?.name;
      issue.status =
        (previousStatusName
          ? nextStatusesByName.get(previousStatusName.trim().toLowerCase())
          : null) ?? nextInitialStatusId;

      const nextCustomFields = {};
      for (const field of nextConfig.customFields) {
        const previousField = previousFieldsByKey.get(
          `${field.type}:${field.name.trim().toLowerCase()}`
        );
        if (!previousField) {
          continue;
        }

        const previousValue = issue.customFields?.[previousField.id];
        if (previousValue === undefined || previousValue === null || previousValue === '') {
          continue;
        }

        const validationError = validateCustomFieldValue(
          projectId,
          nextConfig,
          field,
          previousValue,
          issue.id
        );
        if (!validationError) {
          nextCustomFields[field.id] = previousValue;
        }
      }

      issue.customFields = nextCustomFields;
    });
};

const isTransitionAllowed = (issue, transition, currentUserId, currentRoleId) =>
  transition.conditions.some((condition) => {
    if (condition.type === 'role') {
      return condition.roleId === currentRoleId;
    }

    if (condition.type === 'author') {
      return issue.authorId === currentUserId;
    }

    if (condition.type === 'assignee') {
      return issue.assigneeIds.includes(currentUserId);
    }

    if (condition.type === 'field_user_reference') {
      return issue.customFields?.[condition.customFieldId] === currentUserId;
    }

    return false;
  });

const canTransitionIssue = (issue, toStatus, access) => {
  if (issue.status === toStatus) return true;

  const statusExists = access.config.lifecycle.statuses.some(
    (status) => status.id === toStatus
  );
  if (!statusExists) return false;

  if (access.config.lifecycle.transitionRulesEnabled === false) {
    return true;
  }

  if (!hasPermission(access.role, 'issue.edit')) {
    return false;
  }

  const transition = access.config.lifecycle.transitions.find(
    (item) => item.fromStatusId === issue.status && item.toStatusId === toStatus
  );

  return transition
    ? isTransitionAllowed(issue, transition, access.user.id, access.role.id)
    : false;
};

const toLifecycleGraph = (lifecycle) => ({
  statuses: lifecycle.statuses.map((status) => status.id),
  transitions: lifecycle.transitions.map((transition) => ({
    from: transition.fromStatusId,
    to: transition.toStatusId,
    allowedRoles: transition.conditions
      .filter((condition) => condition.type === 'role')
      .map((condition) => condition.roleId),
    authorAllowed: transition.conditions.some(
      (condition) => condition.type === 'author'
    ),
    assigneeAllowed: transition.conditions.some(
      (condition) => condition.type === 'assignee'
    ),
  })),
});

const removeProjectMember = (projectId, userId) => {
  const projectMemberIndex = members.findIndex(
    (member) => member.projectId === projectId && member.userId === userId
  );
  if (projectMemberIndex === -1) {
    return error(404, 'Member not found');
  }

  members.splice(projectMemberIndex, 1);
  return ok();
};

const validateProjectConfig = (projectId, config) => {
  if (!config.roles?.length) {
    return 'Project must have at least one role';
  }
  if (!config.lifecycle?.statuses?.length) {
    return 'Project must have at least one status';
  }
  if (typeof config.lifecycle.transitionRulesEnabled !== 'boolean') {
    return 'Lifecycle transitionRulesEnabled must be boolean';
  }

  const roleIds = new Set(config.roles.map((role) => role.id));
  const statusIds = new Set(config.lifecycle.statuses.map((status) => status.id));
  const customFieldsById = new Map(
    config.customFields.map((field) => [field.id, field])
  );
  const expectedFieldOrder = createFieldOrder(config.customFields);
  const expectedFieldIds = new Set(expectedFieldOrder);

  if (
    config.lifecycle.statuses.filter((status) => status.isInitial).length !== 1
  ) {
    return 'Exactly one status must be marked as initial';
  }

  if (
    getProjectMembers(projectId).some((member) => !roleIds.has(member.roleId))
  ) {
    return 'At least one project member is assigned to a missing role';
  }

  const projectIssues = issues.filter(
    (issue) => issue.projectId === projectId && !deletedIssueIds.has(issue.id)
  );
  if (projectIssues.some((issue) => !statusIds.has(issue.status))) {
    return 'At least one issue uses a status that no longer exists';
  }

  for (const field of config.customFields) {
    if (
      field.type === 'user_reference' &&
      field.config.allowedRoleIds.some((roleId) => !roleIds.has(roleId))
    ) {
      return `${field.name} references a missing role`;
    }
  }

  if (!Array.isArray(config.fieldOrder)) {
    return 'Field order must be present';
  }

  if (config.fieldOrder.length !== expectedFieldOrder.length) {
    return 'Field order must include every system and custom field exactly once';
  }

  if (
    config.fieldOrder.some(
      (fieldId, index) =>
        !expectedFieldIds.has(fieldId) || config.fieldOrder.indexOf(fieldId) !== index
    )
  ) {
    return 'Field order contains an invalid or duplicated field';
  }

  for (const transition of config.lifecycle.transitions) {
    if (
      !statusIds.has(transition.fromStatusId) ||
      !statusIds.has(transition.toStatusId)
    ) {
      return 'A transition references a missing status';
    }

    for (const condition of transition.conditions) {
      if (condition.type === 'role' && !roleIds.has(condition.roleId)) {
        return 'A transition references a missing role';
      }

      if (condition.type === 'field_user_reference') {
        const field = customFieldsById.get(condition.customFieldId);
        if (!field || field.type !== 'user_reference') {
          return 'A transition references an invalid user reference field';
        }
      }
    }
  }

  return null;
};

const filterIssues = (projectId, filters = {}) => {
  return issues.filter((issue) => {
    if (deletedIssueIds.has(issue.id)) return false;
    if (issue.projectId !== projectId) return false;

    if (filters.nameQuery) {
      const query = String(filters.nameQuery).toLowerCase();
      if (!issue.name.toLowerCase().includes(query)) return false;
    }

    if (filters.types?.length && !filters.types.includes(issue.type)) {
      return false;
    }

    if (
      filters.priorities?.length &&
      !filters.priorities.includes(issue.priority)
    ) {
      return false;
    }

    if (filters.assigneeId && !issue.assigneeIds.includes(filters.assigneeId)) {
      return false;
    }

    if (filters.dateFrom && issue.dueDate && issue.dueDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && issue.dueDate && issue.dueDate > filters.dateTo) {
      return false;
    }

    return Object.entries(filters.customFields ?? {}).every(([fieldId, value]) => {
      if (value === '' || value === null || value === undefined) {
        return true;
      }

      const issueValue = issue.customFields?.[fieldId];
      if (typeof issueValue === 'string') {
        return issueValue.toLowerCase().includes(String(value).toLowerCase());
      }

      return issueValue === value;
    });
  });
};

const normalizeAttachments = (requestBody) => {
  if (Array.isArray(requestBody.attachments)) return requestBody.attachments;

  return (requestBody.attachmentFileNames ?? []).map((url) => ({
    originalFileName: String(url).split('/').pop() || 'attachment',
    url,
  }));
};

const route = (path, method, handler) => ({
  path,
  method,
  routes: [
    {
      data: (request) => handler(request),
      interceptors: {
        response: (data, { setStatusCode, setHeader }) => {
          setStatusCode(data.statusCode ?? 200);
          if (data.downloadName) {
            setHeader('Content-Disposition', `filename=${data.downloadName}`);
          }
          return data.body;
        },
      },
    },
  ],
});

const config = [
  {
    baseUrl: '/api',
    cors: {
      origin: [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174',
        'http://127.0.0.1:4173',
        'http://localhost:4173',
      ],
      credentials: true,
      allowedHeaders: ['authorization', 'content-type'],
      exposedHeaders: ['*'],
    },
  },
  {
    name: 'issue-tracker-api',
    configs: [
      route('/auth/register', 'post', (request) => {
        const { email, username, password } = request.body;
        if (users.some((user) => user.email === email)) {
          return error(409, 'User already exists');
        }

        const user = {
          id: Math.max(...users.map((item) => item.id)) + 1,
          email,
          username,
          password,
        };
        users.push(user);

        return ok(toProfile(user));
      }),
      route('/auth/login', 'post', (request) => {
        const { email, password } = request.body;
        const user = users.find(
          (item) => item.email === email && item.password === password
        );

        return user ? ok('OK') : error(401, 'Invalid credentials');
      }),
      route('/users/me', 'get', (request) => {
        const { user, response } = requireUser(request);
        if (response) return response;

        return ok(toProfile(user));
      }),
      route('/users/search', 'get', (request) => {
        const { response } = requireUser(request);
        if (response) return response;

        const query = String(request.query.query ?? '').toLowerCase();
        return ok(
          users
            .filter(
              (user) =>
                user.email.toLowerCase().includes(query) ||
                user.username.toLowerCase().includes(query)
            )
            .map(toProfile)
        );
      }),
      route('/projects', 'get', (request) => {
        const { user, response } = requireUser(request);
        if (response) return response;

        const visibleProjects = members
          .filter((member) => member.userId === user.id)
          .map((member) => {
            const project = getProject(member.projectId);
            return project ? toProject(project) : null;
          })
          .filter(Boolean);

        return ok(visibleProjects);
      }),
      route('/projects', 'post', (request) => {
        const { user, response } = requireUser(request);
        if (response) return response;

        const templateProjectId = request.body.templateProjectId
          ? Number(request.body.templateProjectId)
          : null;
        const templateConfig = templateProjectId
          ? getConfig(templateProjectId)
          : createDefaultProjectConfig(counters.project);

        if (templateProjectId) {
          const sourceAccess = ensureProjectAccess(request, templateProjectId);
          if (sourceAccess.response) {
            return sourceAccess.response;
          }
        }

        const projectId = counters.project++;
        const project = {
          id: projectId,
          name: request.body.name,
          ownerId: user.id,
          archived: false,
        };
        projects.push(project);

        const nextConfig = templateProjectId
          ? cloneConfigForProject(projectId, normalizeTemplateConfig(templateConfig))
          : createDefaultProjectConfig(projectId);
        projectConfigs.set(projectId, nextConfig);

        const ownerRole =
          getRoleByName(nextConfig, 'Owner') ??
          nextConfig.roles.find((role) => hasPermission(role, 'settings.manage')) ??
          nextConfig.roles[0];
        members.push({
          projectId,
          userId: user.id,
          roleId: ownerRole.id,
        });

        return ok(toProject(project));
      }),
      route('/projects/:projectId', 'get', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId);
        if (access.response) return access.response;

        return ok(toProject(access.project));
      }),
      route('/projects/:projectId/config', 'get', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId);
        if (access.response) return access.response;

        return ok(access.config);
      }),
      route('/projects/:projectId/config', 'put', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId, 'settings.manage');
        if (access.response) return access.response;

        const nextConfig = {
          ...structuredClone(request.body),
          projectId,
          updatedAt: new Date().toISOString(),
        };
        const validationError = validateProjectConfig(projectId, nextConfig);
        if (validationError) {
          return error(400, validationError);
        }

        projectConfigs.set(projectId, nextConfig);
        return ok(nextConfig);
      }),
      route('/projects/:projectId/template', 'get', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId);
        if (access.response) return access.response;

        return ok({
          sourceProjectId: projectId,
          sourceProjectName: access.project.name,
          config: normalizeTemplateConfig(access.config),
        });
      }),
      route('/projects/:projectId/template', 'post', (request) => {
        const targetProjectId = getId(request, 'projectId');
        const targetAccess = ensureProjectAccess(
          request,
          targetProjectId,
          'template.apply'
        );
        if (targetAccess.response) return targetAccess.response;

        const sourceProjectId = Number(request.body.sourceProjectId);
        const sourceAccess = ensureProjectAccess(request, sourceProjectId);
        if (sourceAccess.response) return sourceAccess.response;

        const previousConfig = targetAccess.config;
        const nextConfig = cloneConfigForProject(
          targetProjectId,
          normalizeTemplateConfig(sourceAccess.config)
        );

        remapMembersToConfig(targetProjectId, previousConfig, nextConfig);
        remapIssuesToConfig(targetProjectId, previousConfig, nextConfig);
        projectConfigs.set(targetProjectId, nextConfig);

        return ok(nextConfig);
      }),
      route('/projects/:projectId/members', 'get', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId);
        if (access.response) return access.response;

        return ok(getProjectMembers(projectId).map((member) => toMemberProfile(projectId, member)));
      }),
      route('/projects/:projectId/invite-candidates', 'get', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId, 'members.invite');
        if (access.response) return access.response;

        const query = String(request.query.query ?? '').toLowerCase();
        const projectMemberIds = new Set(
          getProjectMembers(projectId).map((member) => member.userId)
        );

        return ok(
          users
            .filter((user) => !projectMemberIds.has(user.id))
            .filter(
              (user) =>
                user.email.toLowerCase().includes(query) ||
                user.username.toLowerCase().includes(query)
            )
            .map(toProfile)
        );
      }),
      route('/projects/:projectId/my-role', 'get', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId);
        if (access.response) return access.response;

        return ok({ role: access.role });
      }),
      route('/projects/:projectId/invite', 'post', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId, 'members.invite');
        if (access.response) return access.response;

        const roleId = String(request.body.roleId);
        if (!getRole(access.config, roleId)) {
          return error(400, 'Selected role does not exist');
        }

        const invitedUser = getUserById(Number(request.body.userId));
        if (!invitedUser) {
          return error(404, 'User not found');
        }

        const existingMember = getMember(projectId, invitedUser.id);
        if (existingMember) {
          existingMember.roleId = roleId;
        } else {
          members.push({
            projectId,
            userId: invitedUser.id,
            roleId,
          });
        }

        return ok({});
      }),
      route('/projects/:projectId/members/:userId/role', 'put', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(
          request,
          projectId,
          'members.assignRole'
        );
        if (access.response) return access.response;

        const member = getMember(projectId, getId(request, 'userId'));
        if (!member) {
          return error(404, 'Member not found');
        }

        const roleId = String(request.body.roleId);
        if (!getRole(access.config, roleId)) {
          return error(400, 'Selected role does not exist');
        }

        member.roleId = roleId;
        return ok(toMemberProfile(projectId, member));
      }),
      route('/projects/:projectId/members/:userId', 'delete', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId, 'members.remove');
        if (access.response) return access.response;

        return removeProjectMember(projectId, getId(request, 'userId'));
      }),
      route('/projects/:projectId/remove-member/:userId', 'post', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId, 'members.remove');
        if (access.response) return access.response;

        return removeProjectMember(projectId, getId(request, 'userId'));
      }),
      route('/projects/:projectId/archive', 'post', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId, 'project.archive');
        if (access.response) return access.response;

        access.project.archived = true;
        return ok();
      }),
      route('/projects/:projectId/restore', 'post', (request) => {
        const projectId = getId(request, 'projectId');
        const access = ensureProjectAccess(request, projectId, 'project.restore');
        if (access.response) return access.response;

        access.project.archived = false;
        return ok();
      }),
      route('/issues/board', 'post', (request) => {
        const projectId = Number(request.query.projectId);
        const access = ensureProjectAccess(request, projectId, 'issue.view');
        if (access.response) return access.response;

        return ok(filterIssues(projectId, request.body ?? {}));
      }),
      route('/issues/trash', 'get', (request) => {
        const projectId = Number(request.query.projectId);
        const access = ensureProjectAccess(request, projectId, 'issue.view');
        if (access.response) return access.response;

        return ok(
          issues.filter(
            (issue) =>
              issue.projectId === projectId && deletedIssueIds.has(issue.id)
          )
        );
      }),
      route('/issues', 'post', (request) => {
        const projectId = Number(request.body.projectId);
        const access = ensureProjectAccess(request, projectId, 'issue.create');
        if (access.response) return access.response;

        const customFieldResult = sanitizeCustomFields(
          projectId,
          access.config,
          request.body.customFields ?? {}
        );
        if (customFieldResult.error) {
          return error(400, customFieldResult.error);
        }

        const issue = {
          id: counters.issue++,
          projectId,
          name: String(request.body.name ?? '').trim(),
          type: request.body.type ?? 'TASK',
          priority: request.body.priority ?? 'HIGH',
          status: getInitialStatusId(access.config),
          description: request.body.description ?? '',
          assigneeIds: (request.body.assigneeIds ?? []).map(Number),
          authorId: access.user.id,
          startDate: today,
          dueDate: request.body.dueDate ?? '',
          attachments: normalizeAttachments(request.body),
          customFields: customFieldResult.sanitized,
        };

        issues.push(issue);
        return ok(issue);
      }),
      route('/issues/:id', 'get', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        const access = ensureProjectAccess(request, issue.projectId, 'issue.view');
        if (access.response) return access.response;

        return ok(issue);
      }),
      route('/issues/:id', 'put', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        const access = ensureProjectAccess(request, issue.projectId, 'issue.edit');
        if (access.response) return access.response;

        const customFieldResult = sanitizeCustomFields(
          issue.projectId,
          access.config,
          request.body.customFields ?? issue.customFields ?? {},
          issue.id
        );
        if (customFieldResult.error) {
          return error(400, customFieldResult.error);
        }
        if (!request.body.name || !request.body.priority || !request.body.type) {
          return error(400, 'name, priority and type are required');
        }
        if (request.body.status) {
          const statusExists = access.config.lifecycle.statuses.some(
            (status) => status.id === request.body.status
          );
          if (!statusExists) {
            return error(400, 'Target status does not exist');
          }
        }

        Object.assign(issue, {
          name: request.body.name,
          description: request.body.description ?? issue.description,
          priority: request.body.priority,
          type: request.body.type,
          status: request.body.status ?? issue.status,
          assigneeIds: (request.body.assigneeIds ?? issue.assigneeIds).map(Number),
          dueDate: request.body.dueDate ?? issue.dueDate,
          attachments: request.body.attachments ?? issue.attachments,
          customFields: customFieldResult.sanitized,
        });

        return ok(issue);
      }),
      route('/issues/:id/status', 'put', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        const access = ensureProjectAccess(request, issue.projectId);
        if (access.response) return access.response;

        const nextStatus = String(request.body.newStatus);
        const statusExists = access.config.lifecycle.statuses.some(
          (status) => status.id === nextStatus
        );
        if (!statusExists) {
          return error(400, 'Target status does not exist');
        }

        if (access.config.lifecycle.transitionRulesEnabled === false) {
          issue.status = nextStatus;
          return ok();
        }

        if (!hasPermission(access.role, 'issue.edit')) {
          return error(403, 'Insufficient permissions');
        }

        const transition = access.config.lifecycle.transitions.find(
          (item) =>
            item.fromStatusId === issue.status && item.toStatusId === nextStatus
        );
        if (!transition) {
          return error(400, 'Transition is not configured');
        }

        if (!isTransitionAllowed(issue, transition, access.user.id, access.role.id)) {
          return error(403, 'Transition is not allowed for the current user');
        }

        issue.status = nextStatus;
        return ok();
      }),
      route('/issues/:id', 'delete', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        const access = ensureProjectAccess(request, issue.projectId, 'issue.remove');
        if (access.response) return access.response;

        deletedIssueIds.add(issue.id);
        return ok();
      }),
      route('/issues/:id/restore', 'post', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        const access = ensureProjectAccess(request, issue.projectId, 'issue.edit');
        if (access.response) return access.response;

        deletedIssueIds.delete(issue.id);
        return ok();
      }),
      route('/issues/:id/attachments', 'delete', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        const access = ensureProjectAccess(request, issue.projectId, 'issue.edit');
        if (access.response) return access.response;

        issue.attachments = issue.attachments.filter(
          (attachment) => attachment.url !== request.query.url
        );

        return ok();
      }),
      route('/attachments/upload', 'post', () =>
        ok({ url: `/files/mock-${counters.attachment++}.txt` })
      ),
      route('/attachments/download', 'get', (request) => ({
        statusCode: 200,
        downloadName: request.query.filename ?? 'attachment.txt',
        body: `Mock file: ${request.query.filename ?? 'attachment.txt'}`,
      })),
      route('/lifecycle/graph', 'get', () => {
        const lifecycle = getConfig(1).lifecycle;
        return ok(toLifecycleGraph(lifecycle));
      }),
      route('/lifecycle/can-transition', 'post', (request) => {
        const issue = issues.find((item) => item.id === Number(request.body.issueId));
        if (!issue) return error(404, 'Issue not found');

        const access = ensureProjectAccess(request, issue.projectId);
        if (access.response) return access.response;

        if (issue.status !== request.body.from) {
          return ok(false);
        }

        return ok(canTransitionIssue(issue, String(request.body.to), access));
      }),
    ],
  },
];

export default config;
