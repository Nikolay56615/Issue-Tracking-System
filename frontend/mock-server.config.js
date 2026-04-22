const today = '2026-04-22';

const users = [
  {
    id: 1,
    email: 'owner@example.com',
    username: 'Owner',
    password: 'password',
  },
  {
    id: 2,
    email: 'admin@example.com',
    username: 'Admin',
    password: 'password',
  },
  {
    id: 3,
    email: 'worker@example.com',
    username: 'Worker',
    password: 'password',
  },
  {
    id: 4,
    email: 'reviewer@example.com',
    username: 'Reviewer',
    password: 'password',
  },
];

const projects = [
  {
    id: 1,
    name: 'Mock Issue Tracker',
    ownerId: 1,
    archived: false,
  },
];

const members = [
  { projectId: 1, userId: 1, role: 'OWNER' },
  { projectId: 1, userId: 2, role: 'ADMIN' },
  { projectId: 1, userId: 3, role: 'WORKER' },
  { projectId: 1, userId: 4, role: 'REVIEWER' },
];

const defaultConfig = {
  projectId: 1,
  issueFields: [
    {
      id: 'id',
      source: 'system',
      label: 'Id',
      type: 'number',
      required: true,
      editable: false,
      order: 1,
      visibleOn: ['dialog'],
    },
    {
      id: 'projectId',
      source: 'system',
      label: 'Project',
      type: 'number',
      required: true,
      editable: false,
      order: 2,
      visibleOn: ['dialog'],
    },
    {
      id: 'name',
      source: 'system',
      label: 'Issue Name',
      type: 'text',
      required: true,
      editable: true,
      order: 3,
      visibleOn: ['create', 'edit', 'card', 'dialog', 'filter'],
    },
    {
      id: 'status',
      source: 'system',
      label: 'Status',
      type: 'select',
      required: true,
      editable: false,
      order: 4,
      visibleOn: ['dialog'],
    },
    {
      id: 'type',
      source: 'system',
      label: 'Type',
      type: 'select',
      required: false,
      editable: true,
      order: 5,
      visibleOn: ['create', 'edit', 'card', 'dialog', 'filter'],
      options: [
        { label: 'Task', value: 'TASK' },
        { label: 'Bug', value: 'BUG' },
        { label: 'Feature', value: 'FEATURE' },
        { label: 'Search', value: 'SEARCH' },
      ],
    },
    {
      id: 'priority',
      source: 'system',
      label: 'Priority',
      type: 'select',
      required: false,
      editable: true,
      order: 6,
      visibleOn: ['create', 'edit', 'card', 'dialog', 'filter'],
      options: [
        { label: 'Urgent', value: 'URGENT' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ],
    },
    {
      id: 'description',
      source: 'system',
      label: 'Description',
      type: 'textarea',
      required: false,
      editable: true,
      order: 7,
      visibleOn: ['create', 'edit', 'card', 'dialog'],
    },
    {
      id: 'assigneeIds',
      source: 'system',
      label: 'Assignee',
      type: 'select',
      required: false,
      editable: true,
      order: 8,
      visibleOn: ['create', 'edit', 'dialog', 'filter'],
    },
    {
      id: 'authorId',
      source: 'system',
      label: 'Author',
      type: 'number',
      required: true,
      editable: false,
      order: 9,
      visibleOn: ['dialog'],
    },
    {
      id: 'dueDate',
      source: 'system',
      label: 'Due Date',
      type: 'date',
      required: false,
      editable: true,
      order: 10,
      visibleOn: ['create', 'edit', 'card', 'dialog', 'filter'],
    },
    {
      id: 'attachments',
      source: 'system',
      label: 'Attachments',
      type: 'text',
      required: false,
      editable: true,
      order: 11,
      visibleOn: ['create', 'edit', 'dialog'],
    },
    {
      id: 'env',
      source: 'custom',
      label: 'Environment',
      type: 'select',
      required: false,
      editable: true,
      order: 12,
      visibleOn: ['create', 'edit', 'card', 'dialog', 'filter'],
      options: [
        { label: 'Production', value: 'Production' },
        { label: 'Staging', value: 'Staging' },
        { label: 'Local', value: 'Local' },
      ],
    },
    {
      id: 'storyPoints',
      source: 'custom',
      label: 'Story points',
      type: 'number',
      required: false,
      editable: true,
      order: 13,
      visibleOn: ['create', 'edit', 'dialog', 'filter'],
    },
    {
      id: 'qaRequired',
      source: 'custom',
      label: 'QA required',
      type: 'checkbox',
      required: false,
      editable: true,
      order: 14,
      visibleOn: ['create', 'edit', 'card', 'dialog', 'filter'],
    },
  ],
  lifecycle: {
    statuses: [
      { id: 'BACKLOG', label: 'Backlog', order: 1, isInitial: true },
      { id: 'IN_PROGRESS', label: 'In Progress', order: 2 },
      { id: 'REVIEW', label: 'Review', order: 3 },
      { id: 'DONE', label: 'Done', order: 4 },
    ],
    transitions: [
      {
        from: 'BACKLOG',
        to: 'IN_PROGRESS',
        allowedRoles: ['WORKER', 'ADMIN', 'OWNER'],
        authorAllowed: true,
        assigneeAllowed: true,
      },
      {
        from: 'IN_PROGRESS',
        to: 'REVIEW',
        allowedRoles: ['WORKER', 'ADMIN', 'OWNER'],
        authorAllowed: false,
        assigneeAllowed: true,
      },
      {
        from: 'REVIEW',
        to: 'DONE',
        allowedRoles: ['REVIEWER', 'ADMIN', 'OWNER'],
        authorAllowed: false,
        assigneeAllowed: false,
      },
      {
        from: 'REVIEW',
        to: 'IN_PROGRESS',
        allowedRoles: ['REVIEWER', 'ADMIN', 'OWNER'],
        authorAllowed: false,
        assigneeAllowed: false,
      },
    ],
  },
  updatedAt: new Date().toISOString(),
};

const projectConfigs = [structuredClone(defaultConfig)];

const issues = [
  {
    id: 101,
    projectId: 1,
    name: 'Prototype configurable issue fields',
    type: 'FEATURE',
    priority: 'HIGH',
    status: 'BACKLOG',
    description: 'Add a frontend-first configurable issue model.',
    assigneeIds: [3],
    authorId: 1,
    startDate: today,
    dueDate: '2026-04-30',
    attachments: [],
    customFields: {
      env: 'Staging',
      storyPoints: 5,
      qaRequired: true,
    },
  },
  {
    id: 102,
    projectId: 1,
    name: 'Tune lifecycle rules',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    description: 'Validate role-based transitions from project config.',
    assigneeIds: [3],
    authorId: 2,
    startDate: today,
    dueDate: '2026-05-05',
    attachments: [],
    customFields: {
      env: 'Local',
      storyPoints: 3,
      qaRequired: false,
    },
  },
  {
    id: 103,
    projectId: 1,
    name: 'Review mock API behavior',
    type: 'BUG',
    priority: 'LOW',
    status: 'REVIEW',
    description: 'Smoke test mock-config-server request handlers.',
    assigneeIds: [4],
    authorId: 1,
    startDate: today,
    dueDate: '2026-05-10',
    attachments: [],
    customFields: {
      env: 'Production',
      storyPoints: 2,
      qaRequired: true,
    },
  },
];

const deletedIssueIds = new Set();

const ok = (body = {}) => ({ statusCode: 200, body });
const created = (body = {}) => ({ statusCode: 201, body });
const noContent = () => ({ statusCode: 204, body: {} });
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

const toProfile = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
});

const toMemberProfile = (member) => {
  const user = users.find((item) => item.id === member.userId);

  return {
    id: user.id,
    email: user.email,
    name: user.username,
    role: member.role,
  };
};

const getProjectRole = (projectId, userId) =>
  members.find(
    (member) => member.projectId === projectId && member.userId === userId
  )?.role ?? null;

const getConfig = (projectId) => {
  let config = projectConfigs.find((item) => item.projectId === projectId);

  if (!config) {
    config = {
      ...structuredClone(defaultConfig),
      projectId,
      updatedAt: new Date().toISOString(),
    };
    projectConfigs.push(config);
  }

  return config;
};

const getInitialStatus = (projectId) => {
  const config = getConfig(projectId);
  const initialStatus =
    config.lifecycle.statuses.find((status) => status.isInitial) ??
    [...config.lifecycle.statuses].sort((a, b) => a.order - b.order)[0];

  return initialStatus?.id ?? 'BACKLOG';
};

const filterIssues = (projectId, filters = {}) =>
  issues.filter((issue) => {
    if (deletedIssueIds.has(issue.id)) return false;
    if (issue.projectId !== projectId) return false;
    if (filters.nameQuery) {
      const query = String(filters.nameQuery).toLowerCase();
      if (!issue.name.toLowerCase().includes(query)) return false;
    }
    if (filters.types?.length && !filters.types.includes(issue.type))
      return false;
    if (
      filters.priorities?.length &&
      !filters.priorities.includes(issue.priority)
    ) {
      return false;
    }
    if (filters.assigneeId && !issue.assigneeIds.includes(filters.assigneeId)) {
      return false;
    }
    if (filters.dateFrom && issue.dueDate < filters.dateFrom) return false;
    if (filters.dateTo && issue.dueDate > filters.dateTo) return false;

    return Object.entries(filters.customFields ?? {}).every(
      ([fieldId, value]) => {
        if (value === '' || value === null || value === undefined) return true;

        const issueValue = issue.customFields?.[fieldId];
        if (Array.isArray(issueValue)) return issueValue.includes(value);

        return issueValue === value;
      }
    );
  });

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

        return created(toProfile(user));
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

        const projectIds = members
          .filter((member) => member.userId === user.id)
          .map((member) => member.projectId);

        return ok(
          projects.filter((project) => projectIds.includes(project.id))
        );
      }),
      route('/projects', 'post', (request) => {
        const { user, response } = requireUser(request);
        if (response) return response;

        const project = {
          id: Math.max(...projects.map((item) => item.id)) + 1,
          name: request.body.name,
          ownerId: user.id,
          archived: false,
        };
        projects.push(project);
        members.push({ projectId: project.id, userId: user.id, role: 'OWNER' });
        projectConfigs.push({
          ...structuredClone(defaultConfig),
          projectId: project.id,
          updatedAt: new Date().toISOString(),
        });

        return created(project);
      }),
      route('/projects/:projectId/config', 'get', (request) => {
        const { response } = requireUser(request);
        if (response) return response;

        return ok(getConfig(getId(request, 'projectId')));
      }),
      route('/projects/:projectId/config', 'put', (request) => {
        const { user, response } = requireUser(request);
        if (response) return response;

        const projectId = getId(request, 'projectId');
        const role = getProjectRole(projectId, user.id);
        if (role !== 'ADMIN' && role !== 'OWNER') {
          return error(403, 'Only ADMIN and OWNER can edit project config');
        }

        const index = projectConfigs.findIndex(
          (item) => item.projectId === projectId
        );
        const nextConfig = {
          ...request.body,
          projectId,
          updatedAt: new Date().toISOString(),
        };

        if (index === -1) projectConfigs.push(nextConfig);
        else projectConfigs[index] = nextConfig;

        return ok(nextConfig);
      }),
      route('/projects/:projectId/members', 'get', (request) => {
        const projectId = getId(request, 'projectId');
        return ok(
          members
            .filter((member) => member.projectId === projectId)
            .map(toMemberProfile)
        );
      }),
      route('/projects/:projectId/my-role', 'get', (request) => {
        const { user, response } = requireUser(request);
        if (response) return response;

        const role = getProjectRole(getId(request, 'projectId'), user.id);
        return role ? ok(role) : error(403, 'No project access');
      }),
      route('/projects/:projectId/invite', 'post', (request) => {
        const projectId = getId(request, 'projectId');
        const { userId, role } = request.body;
        const existing = members.find(
          (member) => member.projectId === projectId && member.userId === userId
        );

        if (existing) existing.role = role;
        else members.push({ projectId, userId, role });

        return ok({});
      }),
      route('/projects/:projectId/archive', 'post', (request) => {
        const project = projects.find(
          (item) => item.id === getId(request, 'projectId')
        );
        if (project) project.archived = true;

        return noContent();
      }),
      route('/projects/:projectId/restore', 'post', (request) => {
        const project = projects.find(
          (item) => item.id === getId(request, 'projectId')
        );
        if (project) project.archived = false;

        return noContent();
      }),
      route('/issues/board', 'post', (request) => {
        const projectId = Number(request.query.projectId);
        return ok(filterIssues(projectId, request.body ?? {}));
      }),
      route('/issues/trash', 'get', (request) => {
        const projectId = Number(request.query.projectId);
        return ok(
          issues.filter(
            (issue) =>
              issue.projectId === projectId && deletedIssueIds.has(issue.id)
          )
        );
      }),
      route('/issues', 'post', (request) => {
        const { user, response } = requireUser(request);
        if (response) return response;

        const body = request.body;
        const issue = {
          id: Math.max(...issues.map((item) => item.id)) + 1,
          projectId: body.projectId,
          name: body.name,
          type: body.type ?? 'TASK',
          priority: body.priority ?? 'HIGH',
          status: getInitialStatus(body.projectId),
          description: body.description ?? '',
          assigneeIds: body.assigneeIds ?? [],
          authorId: user.id,
          startDate: today,
          dueDate: body.dueDate ?? '',
          attachments: normalizeAttachments(body),
          customFields: body.customFields ?? {},
        };
        issues.push(issue);

        return created(issue);
      }),
      route('/issues/:id', 'get', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        return issue ? ok(issue) : error(404, 'Issue not found');
      }),
      route('/issues/:id', 'put', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        const body = request.body;
        Object.assign(issue, {
          name: body.name,
          description: body.description ?? issue.description,
          priority: body.priority ?? issue.priority,
          type: body.type ?? issue.type,
          status: body.status ?? issue.status,
          assigneeIds: body.assigneeIds ?? issue.assigneeIds,
          attachments: normalizeAttachments(body),
          customFields: body.customFields ?? issue.customFields ?? {},
        });

        return ok(issue);
      }),
      route('/issues/:id/status', 'put', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        issue.status = request.body.newStatus;

        return noContent();
      }),
      route('/issues/:id', 'delete', (request) => {
        deletedIssueIds.add(getId(request));
        return noContent();
      }),
      route('/issues/:id/restore', 'post', (request) => {
        deletedIssueIds.delete(getId(request));
        return noContent();
      }),
      route('/issues/:id/attachments', 'delete', (request) => {
        const issue = issues.find((item) => item.id === getId(request));
        if (!issue) return error(404, 'Issue not found');

        issue.attachments = issue.attachments.filter(
          (attachment) => attachment.url !== request.query.url
        );

        return noContent();
      }),
      route('/attachments/upload', 'post', () =>
        ok({ url: `/files/mock-${Date.now()}.txt` })
      ),
      route('/attachments/download', 'get', (request) => ({
        statusCode: 200,
        downloadName: request.query.filename ?? 'attachment.txt',
        body: `Mock file: ${request.query.filename ?? 'attachment.txt'}`,
      })),
      route('/lifecycle/graph', 'get', () => {
        const lifecycle = getConfig(1).lifecycle;
        return ok({
          statuses: lifecycle.statuses.map((status) => status.id),
          transitions: lifecycle.transitions,
        });
      }),
      route('/lifecycle/can-transition', 'post', (request) => {
        const { issueId, from, to } = request.body;
        const issue = issues.find((item) => item.id === issueId);
        const lifecycle = getConfig(issue?.projectId ?? 1).lifecycle;

        return ok(
          lifecycle.transitions.some(
            (transition) => transition.from === from && transition.to === to
          )
        );
      }),
    ],
  },
];

export default config;
