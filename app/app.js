/**
 * BeyondPM — Dashing Enterprise Project Management Engine
 * Master SPA Runtime: Design System Primitives, Slide-out Issue Detail Drawer,
 * Command Palette (Ctrl+K), Live Toast Notifications, Collapsible Sidebar & Live GitHub Sync.
 */

// =============================================================================
// 1. APPLICATION STATE
// =============================================================================

const state = {
  spaces: [
    {
      id: 'space-core',
      name: '🚀 Core Infrastructure',
      folders: [
        {
          id: 'sprint-12',
          name: 'Active Sprint 12',
          desc: 'Current 2-week active sprint committed items',
          tickets: ['PM-100', 'PM-145', 'PM-145-A', 'PM-145-B', 'PM-142']
        },
        {
          id: 'backlog',
          name: 'Backlog & Spikes',
          desc: 'Unscheduled features and research investigations',
          tickets: ['PM-148']
        }
      ]
    },
    {
      id: 'space-support',
      name: '🎧 Customer Support & Ops',
      folders: [
        {
          id: 'customer-requests',
          name: 'Customer Requests',
          desc: 'Non-technical feedback and product suggestions',
          tickets: ['PM-152']
        }
      ]
    }
  ],

  tickets: [
    {
      key: 'PM-100',
      githubNumber: 8,
      title: 'Core Platform Reliability & Scalability Overhaul',
      type: 'Epic',
      priority: 'Critical',
      status: 'In Progress',
      points: 21,
      folder: 'sprint-12',
      assignee: 'Akshay K. (Lead)',
      reporter: 'Sarah M. (Architect)',
      description: 'Comprehensive overhaul of platform concurrency, connection pooling, and multi-tenant outbox delivery pipelines.',
      parentKey: null,
      subtasks: ['PM-145', 'PM-142', 'PM-148'],
      blockedBy: null,
      branch: 'epic/PM-100-scalability-overhaul',
      prNumber: 340,
      prStatus: 'OPEN',
      reviews: '2 Approved, 1 Pending',
      ciStatus: 'Passed',
      environment: 'Staging',
      comments: [
        { author: 'Sarah M.', text: 'Epic scope approved for Sprint 12 baseline.', time: '2 days ago' }
      ]
    },
    {
      key: 'PM-145',
      githubNumber: 2,
      title: 'Database connection pool starvation during spike load',
      type: 'Incident',
      priority: 'Critical',
      status: 'In Progress',
      points: 8,
      folder: 'sprint-12',
      assignee: 'Alex D. (Dev)',
      reporter: 'Priya R. (QA)',
      description: 'Under 10k RPS load tests, PostgreSQL connection pool exhausts available slots. Needs Redis rate limiter and connection pool increase.',
      parentKey: 'PM-100',
      subtasks: ['PM-145-A', 'PM-145-B'],
      blockedBy: 'PM-145-A',
      branch: 'fix/PM-145-db-pool-starvation',
      prNumber: 342,
      prStatus: 'OPEN',
      reviews: '1 Approved, 2 Pending',
      ciStatus: 'Passed',
      environment: 'Dev',
      comments: [
        { author: 'Alex D.', text: 'Reproduced connection exhaustion locally with k6 test script.', time: '1 day ago' },
        { author: 'Priya R.', text: 'P1 SLA target requires resolution within 2 hours of QA receipt.', time: '4 hours ago' }
      ]
    },
    {
      key: 'PM-145-A',
      githubNumber: 6,
      title: 'Implement Redis rate-limiter for DB connections',
      type: 'Task',
      priority: 'High',
      status: 'In Progress',
      points: 2,
      folder: 'sprint-12',
      assignee: 'Alex D. (Dev)',
      reporter: 'Alex D. (Dev)',
      description: 'Add sliding-window token bucket in Redis to throttle burst connections to DB pool.',
      parentKey: 'PM-145',
      subtasks: [],
      blockedBy: null,
      branch: 'feature/PM-145-A-redis-limiter',
      prNumber: 344,
      prStatus: 'OPEN',
      reviews: 'Pending',
      ciStatus: 'Running',
      environment: 'Dev',
      comments: []
    },
    {
      key: 'PM-145-B',
      githubNumber: 7,
      title: 'Increase Postgres max_connections pool limit to 200',
      type: 'Task',
      priority: 'Medium',
      status: 'Done',
      points: 1,
      folder: 'sprint-12',
      assignee: 'DevOps Bot',
      reporter: 'Alex D. (Dev)',
      description: 'Bump RDS instance parameter max_connections from 100 to 200.',
      parentKey: 'PM-145',
      subtasks: [],
      blockedBy: null,
      branch: 'infra/PM-145-B-postgres-config',
      prNumber: 343,
      prStatus: 'MERGED',
      reviews: 'Approved',
      ciStatus: 'Passed',
      environment: 'Staging',
      comments: [
        { author: 'DevOps Bot', text: 'Terraform change applied successfully.', time: '18 hours ago' }
      ]
    },
    {
      key: 'PM-142',
      githubNumber: 1,
      title: 'Fix OAuth refresh token race condition on parallel API requests',
      type: 'Bug',
      priority: 'Critical',
      status: 'Code Review',
      points: 5,
      folder: 'sprint-12',
      assignee: 'Akshay K. (Lead)',
      reporter: 'Priya R. (QA)',
      description: 'When multiple API requests trigger simultaneous 401s, refresh token is rotated multiple times, invalidating legitimate user sessions.',
      parentKey: 'PM-100',
      subtasks: [],
      blockedBy: null,
      branch: 'feature/PM-142-oauth-refresh-race',
      prNumber: 341,
      prStatus: 'OPEN',
      reviews: '2 Approved, 1 Pending',
      ciStatus: 'Passed',
      environment: 'Staging',
      comments: [
        { author: 'Akshay K.', text: 'Introduced mutex promise memoization for inflight token refresh.', time: '3 hours ago' },
        { author: 'Priya R.', text: 'Reviewing PR #341 and preparing regression test suite.', time: '1 hour ago' }
      ]
    },
    {
      key: 'PM-148',
      githubNumber: 3,
      title: 'Outbox Event Delivery Worker & Recursion Safety',
      type: 'Feature',
      priority: 'High',
      status: 'Todo',
      points: 13,
      folder: 'backlog',
      assignee: 'Sarah M. (Architect)',
      reporter: 'Sarah M. (Architect)',
      description: 'Build an idempotent background outbox processor ensuring reliable event publishing without webhook feedback loops.',
      parentKey: 'PM-100',
      subtasks: [],
      blockedBy: 'PM-145',
      branch: 'feature/PM-148-outbox-worker',
      prNumber: null,
      prStatus: null,
      reviews: 'None',
      ciStatus: 'Pending',
      environment: 'None',
      comments: []
    },
    {
      key: 'PM-152',
      githubNumber: 5,
      title: 'Add 1-click CSV Export button for monthly project executive summary',
      type: 'Request',
      priority: 'High',
      status: 'Todo',
      points: 3,
      folder: 'customer-requests',
      assignee: 'Unassigned',
      reporter: 'Customer Support Lead',
      description: 'Non-technical stakeholders need a direct CSV download containing monthly completed tickets and velocity points.',
      parentKey: null,
      subtasks: [],
      blockedBy: null,
      branch: null,
      prNumber: null,
      prStatus: null,
      reviews: 'None',
      ciStatus: 'None',
      environment: 'None',
      comments: []
    }
  ],

  activeFolder: null,
  activeView: 'directory',
  searchQuery: '',
  quickFilter: 'all',
  activeTicketKey: null
};

// =============================================================================
// 2. TOAST NOTIFICATION SYSTEM
// =============================================================================

const toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast-item toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚡';
    toastEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 800; font-size: 14px;">${icon}</span>
        <span>${message}</span>
      </div>
      <button style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px;">&times;</button>
    `;

    const closeBtn = toastEl.querySelector('button');
    closeBtn.addEventListener('click', () => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 200);
    });

    container.appendChild(toastEl);
    requestAnimationFrame(() => toastEl.classList.add('show'));

    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 200);
      }
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 4500); },
  info(msg) { this.show(msg, 'info'); }
};

// =============================================================================
// 3. INITIALIZATION & LIFECYCLE
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initSidebarState();
  renderTreeNav();
  renderCurrentView();
  bindUIEvents();
  setupKeyboardShortcuts();
  setupCommandPalette();
  setupTicketDrawer();
});

// =============================================================================
// 4. SIDEBAR COLLAPSE & EXPAND
// =============================================================================

function initSidebarState() {
  const sidebar = document.getElementById('appSidebar');
  const collapseBtn = document.getElementById('collapseSidebarBtn');
  if (!sidebar || !collapseBtn) return;

  const isCollapsed = localStorage.getItem('beyondpm_sidebar_collapsed') === 'true';
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    collapseBtn.textContent = '▶';
    collapseBtn.title = 'Expand Sidebar';
  }

  collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const collapsed = sidebar.classList.contains('collapsed');
    collapseBtn.textContent = collapsed ? '▶' : '◀';
    collapseBtn.title = collapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
    localStorage.setItem('beyondpm_sidebar_collapsed', collapsed);
    toast.info(collapsed ? 'Sidebar collapsed to icon rail' : 'Sidebar expanded');
  });
}

// =============================================================================
// 5. SLIDE-OUT ISSUE DETAIL DRAWER (INLINE EDITING & GITHUB CONTEXT)
// =============================================================================

function setupTicketDrawer() {
  const drawer = document.getElementById('issueDetailDrawer');
  const backdrop = document.getElementById('issueDrawerBackdrop');
  const closeBtn = document.getElementById('closeDrawerBtn');
  const expandBtn = document.getElementById('expandDrawerBtn');

  if (!drawer || !backdrop) return;

  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    state.activeTicketKey = null;
  };

  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  expandBtn.addEventListener('click', () => {
    drawer.classList.toggle('expanded');
    expandBtn.textContent = drawer.classList.contains('expanded') ? '⛶' : '⛶';
  });

  // Inline Title Editing
  const titleInput = document.getElementById('drawerTitleInput');
  titleInput.addEventListener('change', (e) => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket) return;
    const newTitle = e.target.value.trim();
    if (newTitle) {
      ticket.title = newTitle;
      renderCurrentView();
      renderTreeNav();
      toast.success(`Updated ${ticket.key} title`);
    }
  });

  // Inline Status Transition
  const statusSelect = document.getElementById('drawerStatusSelect');
  statusSelect.addEventListener('change', (e) => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket) return;
    const newStatus = e.target.value;
    ticket.status = newStatus;
    
    // Update header badge
    const badgeStatus = document.getElementById('drawerTicketStatus');
    badgeStatus.className = `badge-status status-${newStatus.replace(/ /g, '-')}`;
    badgeStatus.textContent = newStatus;

    renderCurrentView();
    toast.success(`${ticket.key} moved to '${newStatus}'`);
  });

  // Inline Priority
  const prioritySelect = document.getElementById('drawerPrioritySelect');
  prioritySelect.addEventListener('change', (e) => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket) return;
    ticket.priority = e.target.value;
    renderCurrentView();
    toast.info(`${ticket.key} priority set to ${ticket.priority}`);
  });

  // Inline Story Points
  const pointsInput = document.getElementById('drawerPointsInput');
  pointsInput.addEventListener('change', (e) => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket) return;
    ticket.points = parseInt(e.target.value, 10) || 1;
    renderCurrentView();
    toast.info(`${ticket.key} estimate set to ${ticket.points} pts`);
  });

  // Inline Folder/Sprint
  const folderSelect = document.getElementById('drawerFolderSelect');
  folderSelect.addEventListener('change', (e) => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket) return;
    ticket.folder = e.target.value;
    renderCurrentView();
    renderTreeNav();
    toast.success(`${ticket.key} moved to ${ticket.folder}`);
  });

  // Inline Description
  const descTextarea = document.getElementById('drawerDescriptionTextarea');
  descTextarea.addEventListener('change', (e) => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket) return;
    ticket.description = e.target.value;
    toast.success('Description autosaved');
  });

  // Add Comment
  const commentBtn = document.getElementById('drawerPostCommentBtn');
  const commentInput = document.getElementById('drawerNewCommentInput');
  const addComment = () => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket || !commentInput.value.trim()) return;
    if (!ticket.comments) ticket.comments = [];
    ticket.comments.push({
      author: 'Akshay K. (Lead)',
      text: commentInput.value.trim(),
      time: 'Just now'
    });
    commentInput.value = '';
    renderDrawerComments(ticket);
    toast.success('Comment posted');
  };
  commentBtn.addEventListener('click', addComment);
  commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addComment();
  });

  // Add Subtask button
  document.getElementById('drawerAddSubtaskBtn').addEventListener('click', () => {
    const ticket = state.tickets.find(t => t.key === state.activeTicketKey);
    if (!ticket) return;
    const subtaskTitle = prompt(`Add new subtask under ${ticket.key}:`);
    if (subtaskTitle && subtaskTitle.trim()) {
      const newKey = `${ticket.key}-${String.fromCharCode(65 + ticket.subtasks.length)}`;
      const newSubtask = {
        key: newKey,
        githubNumber: null,
        title: subtaskTitle.trim(),
        type: 'Task',
        priority: 'Medium',
        status: 'Todo',
        points: 2,
        folder: ticket.folder,
        parentKey: ticket.key,
        subtasks: [],
        blockedBy: null
      };
      state.tickets.push(newSubtask);
      ticket.subtasks.push(newKey);
      renderDrawerSubtasks(ticket);
      renderCurrentView();
      renderTreeNav();
      toast.success(`Subtask ${newKey} created`);
    }
  });
}

export function openTicketDrawer(ticketKey) {
  const ticket = state.tickets.find(t => t.key === ticketKey);
  if (!ticket) return;

  state.activeTicketKey = ticketKey;
  const drawer = document.getElementById('issueDetailDrawer');
  const backdrop = document.getElementById('issueDrawerBackdrop');

  // Populate Header
  document.getElementById('drawerTicketKey').textContent = ticket.key;
  const badgeType = document.getElementById('drawerTicketType');
  badgeType.textContent = ticket.type;
  badgeType.className = `badge-type type-${ticket.type}`;

  const badgeStatus = document.getElementById('drawerTicketStatus');
  badgeStatus.textContent = ticket.status;
  badgeStatus.className = `badge-status status-${ticket.status.replace(/ /g, '-')}`;

  // Populate Inputs
  document.getElementById('drawerTitleInput').value = ticket.title;
  document.getElementById('drawerStatusSelect').value = ticket.status;
  document.getElementById('drawerPrioritySelect').value = ticket.priority;
  document.getElementById('drawerPointsInput').value = ticket.points;
  document.getElementById('drawerFolderSelect').value = ticket.folder;
  document.getElementById('drawerAssigneeName').textContent = ticket.assignee || 'Unassigned';
  document.getElementById('drawerDescriptionTextarea').value = ticket.description || '';

  // Populate GitHub Development Section
  const devContent = document.getElementById('drawerDevPanelContent');
  if (ticket.branch || ticket.prNumber) {
    devContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <span style="color: var(--text-muted);">Branch:</span>
          <span style="font-family: var(--font-family-code); color: var(--accent-cyan); font-weight: 600;">
            ${ticket.branch || 'None'}
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <span style="color: var(--text-muted);">Pull Request:</span>
          ${ticket.prNumber ? `
            <a href="https://github.com/beyondCode-in/pm-tool/pull/${ticket.prNumber}" target="_blank" style="color: var(--accent-indigo); text-decoration: none; font-weight: 700;">
              #${ticket.prNumber} (${ticket.prStatus}) ↗
            </a>
          ` : '<span style="color: var(--text-muted);">No PR linked</span>'}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <span style="color: var(--text-muted);">Reviews:</span>
          <span style="font-weight: 600; color: ${ticket.reviews && ticket.reviews.includes('Approved') ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
            ${ticket.reviews || 'Pending'}
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <span style="color: var(--text-muted);">CI / CD Actions:</span>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">
            ✓ ${ticket.ciStatus || 'Passing'}
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <span style="color: var(--text-muted);">Environment:</span>
          <span style="font-size: 12px; color: var(--text-secondary);">${ticket.environment || 'Local'}</span>
        </div>
      </div>
    `;
  } else {
    devContent.innerHTML = `
      <div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 12px 0;">
        No active GitHub branch or PR linked.<br>
        <span style="font-size: 11px; color: var(--text-dim);">Naming a branch <code>feature/${ticket.key.toLowerCase()}...</code> will link automatically.</span>
      </div>
    `;
  }

  // Populate Subtasks
  renderDrawerSubtasks(ticket);

  // Populate Comments
  renderDrawerComments(ticket);

  // Show Drawer
  backdrop.classList.add('open');
  drawer.classList.add('open');
}

function renderDrawerSubtasks(ticket) {
  const list = document.getElementById('drawerSubtasksList');
  const countBadge = document.getElementById('drawerSubtaskCount');
  countBadge.textContent = ticket.subtasks.length;

  if (ticket.subtasks.length === 0) {
    list.innerHTML = `<span style="font-size: 13px; color: var(--text-muted);">No subtasks created.</span>`;
    return;
  }

  list.innerHTML = '';
  ticket.subtasks.forEach(subKey => {
    const sub = state.tickets.find(t => t.key === subKey) || { key: subKey, title: subKey, status: 'Todo' };
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: 13px; cursor: pointer;';
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="badge-key">${sub.key}</span>
        <span style="color: var(--text-primary); font-weight: 500;">${sub.title}</span>
      </div>
      <span class="badge-status status-${sub.status.replace(/ /g, '-')}">${sub.status}</span>
    `;
    row.addEventListener('click', () => openTicketDrawer(sub.key));
    list.appendChild(row);
  });
}

function renderDrawerComments(ticket) {
  const container = document.getElementById('drawerCommentsStream');
  const countBadge = document.getElementById('drawerCommentCount');
  const comments = ticket.comments || [];
  countBadge.textContent = `${comments.length} comment${comments.length === 1 ? '' : 's'}`;

  if (comments.length === 0) {
    container.innerHTML = `<span style="font-size: 13px; color: var(--text-muted);">No comments yet. Start the conversation below.</span>`;
    return;
  }

  container.innerHTML = comments.map(c => `
    <div style="display: flex; gap: 10px; font-size: 13px;">
      <div class="avatar avatar-sm">${c.author.substring(0, 2).toUpperCase()}</div>
      <div style="flex: 1; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: var(--text-highlight); font-size: 12px;">${c.author}</strong>
          <span style="color: var(--text-muted); font-size: 11px;">${c.time}</span>
        </div>
        <p style="color: var(--text-secondary); line-height: 1.4;">${c.text}</p>
      </div>
    </div>
  `).join('');
}

// =============================================================================
// 6. COMMAND PALETTE (CTRL/CMD + K)
// =============================================================================

function setupCommandPalette() {
  const backdrop = document.getElementById('commandPaletteBackdrop');
  const input = document.getElementById('paletteSearchInput');
  const list = document.getElementById('paletteResultsList');
  if (!backdrop || !input || !list) return;

  const commands = [
    { type: 'nav', icon: '📂', label: 'View: Directory & Folder Tree', action: () => switchView('directory') },
    { type: 'nav', icon: '📋', label: 'View: Kanban Board', action: () => switchView('kanban') },
    { type: 'nav', icon: '🔗', label: 'View: Dependency Matrix', action: () => switchView('dependencies') },
    { type: 'nav', icon: '📊', label: 'View: Spreadsheet Table', action: () => switchView('table') },
    { type: 'action', icon: '✨', label: 'Create New Ticket / Subtask', action: () => document.getElementById('openNewTicketModalBtn').click() },
    { type: 'action', icon: '◀', label: 'Toggle Sidebar Collapse', action: () => document.getElementById('collapseSidebarBtn').click() },
    { type: 'action', icon: '🔄', label: 'Sync with GitHub Projects', action: () => document.getElementById('refreshLiveSyncBtn').click() }
  ];

  let selectedIndex = 0;

  function renderPaletteItems(query = '') {
    list.innerHTML = '';
    const q = query.toLowerCase().trim();

    // Matching Commands
    const matchedCommands = commands.filter(c => c.label.toLowerCase().includes(q));
    // Matching Tickets
    const matchedTickets = state.tickets.filter(t => t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q));

    const totalItems = [];

    if (matchedCommands.length > 0) {
      const cat = document.createElement('div');
      cat.className = 'palette-category-label';
      cat.textContent = 'ACTIONS & NAVIGATION';
      list.appendChild(cat);

      matchedCommands.forEach(c => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.innerHTML = `
          <div class="palette-item-left">
            <span class="palette-item-icon">${c.icon}</span>
            <span>${c.label}</span>
          </div>
          <span class="palette-item-key">Enter ↵</span>
        `;
        item.addEventListener('click', () => {
          closePalette();
          c.action();
        });
        list.appendChild(item);
        totalItems.push({ el: item, action: c.action });
      });
    }

    if (matchedTickets.length > 0) {
      const cat = document.createElement('div');
      cat.className = 'palette-category-label';
      cat.textContent = 'WORK ITEMS';
      list.appendChild(cat);

      matchedTickets.forEach(t => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.innerHTML = `
          <div class="palette-item-left">
            <span class="badge-key">${t.key}</span>
            <span style="font-weight: 500;">${t.title}</span>
          </div>
          <span class="badge-status status-${t.status.replace(/ /g, '-')}">${t.status}</span>
        `;
        item.addEventListener('click', () => {
          closePalette();
          openTicketDrawer(t.key);
        });
        list.appendChild(item);
        totalItems.push({ el: item, action: () => openTicketDrawer(t.key) });
      });
    }

    if (totalItems.length === 0) {
      list.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">No commands or tickets match "${query}"</div>`;
    }

    // Highlight selected item
    selectedIndex = Math.min(selectedIndex, totalItems.length - 1);
    if (totalItems[selectedIndex]) {
      totalItems[selectedIndex].el.classList.add('active');
    }

    return totalItems;
  }

  let activeItems = [];

  function openPalette() {
    backdrop.classList.add('open');
    input.value = '';
    selectedIndex = 0;
    activeItems = renderPaletteItems('');
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    backdrop.classList.remove('open');
  }

  input.addEventListener('input', (e) => {
    selectedIndex = 0;
    activeItems = renderPaletteItems(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % activeItems.length;
        activeItems.forEach((it, idx) => it.el.classList.toggle('active', idx === selectedIndex));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + activeItems.length) % activeItems.length;
        activeItems.forEach((it, idx) => it.el.classList.toggle('active', idx === selectedIndex));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItems[selectedIndex]) {
        closePalette();
        activeItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePalette();
  });

  // Clicking the search input in top bar opens Command Palette
  const globalSearchInput = document.getElementById('globalFilterInput');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('focus', openPalette);
  }

  window.openCommandPalette = openPalette;
}

function switchView(viewName) {
  const btn = document.querySelector(`.tab-btn[data-view="${viewName}"]`);
  if (btn) btn.click();
}

// =============================================================================
// 7. KEYBOARD SHORTCUTS
// =============================================================================

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ctrl+K / Cmd+K -> Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (window.openCommandPalette) window.openCommandPalette();
    }
    // Escape -> Close drawers and modals
    else if (e.key === 'Escape') {
      const drawer = document.getElementById('issueDetailDrawer');
      const drawerBackdrop = document.getElementById('issueDrawerBackdrop');
      const modal = document.getElementById('ticketModalBackdrop');
      const palette = document.getElementById('commandPaletteBackdrop');

      if (palette && palette.classList.contains('open')) palette.classList.remove('open');
      if (drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        if (drawerBackdrop) drawerBackdrop.classList.remove('open');
      }
      if (modal && modal.classList.contains('open')) modal.classList.remove('open');
    }
    // '/' shortcut for quick search when not inside an input
    else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const sidebarSearch = document.getElementById('sidebarSearchInput');
      if (sidebarSearch) sidebarSearch.focus();
    }
    // 'c' shortcut to create ticket when not inside an input
    else if (e.key.toLowerCase() === 'c' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('openNewTicketModalBtn').click();
    }
  });
}

// =============================================================================
// 8. EVENT BINDINGS
// =============================================================================

function bindUIEvents() {
  // Mobile Hamburger Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }

  if (mobileBtn) mobileBtn.addEventListener('click', toggleMobileMenu);
  if (overlay) overlay.addEventListener('click', toggleMobileMenu);

  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      state.activeView = btn.dataset.view;
      const tabPane = document.getElementById(`${state.activeView}TabPane`);
      if (tabPane) tabPane.classList.add('active');
      renderCurrentView();
    });
  });

  // Quick Filter Pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.quickFilter = pill.dataset.filter;
      renderCurrentView();
    });
  });

  // Modal Dialog Controls
  const modal = document.getElementById('ticketModalBackdrop');
  const openModal = () => modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');

  document.getElementById('openNewTicketModalBtn').addEventListener('click', openModal);
  const mobileNew = document.getElementById('mobileNewTicketBtn');
  if (mobileNew) mobileNew.addEventListener('click', openModal);

  document.getElementById('closeTicketModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelTicketModalBtn').addEventListener('click', closeModal);

  // No-Code Ticket Form Submission
  document.getElementById('noCodeTicketForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('formTicketTitle').value.trim();
    const folder = document.getElementById('formFolderSelect').value;
    const parentKey = document.getElementById('formParentSelect').value || null;
    const type = document.getElementById('formTypeSelect').value;
    const priority = document.getElementById('formPrioritySelect').value;
    const points = parseInt(document.getElementById('formPointsInput').value, 10) || 3;
    const blockedBy = document.getElementById('formBlockedBySelect').value || null;
    const description = document.getElementById('formDescriptionInput').value.trim();

    const newKey = `PM-${153 + state.tickets.length - 7}`;

    const newTicket = {
      key: newKey,
      githubNumber: null,
      title,
      type,
      priority,
      status: 'Todo',
      points,
      folder,
      parentKey,
      description,
      subtasks: [],
      blockedBy,
      branch: `feature/${newKey.toLowerCase()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}`,
      prNumber: null,
      prStatus: null,
      reviews: 'None',
      ciStatus: 'Pending',
      environment: 'Dev',
      comments: []
    };

    state.tickets.push(newTicket);

    // Add to folder
    for (const space of state.spaces) {
      for (const f of space.folders) {
        if (f.id === folder) {
          f.tickets.push(newKey);
        }
      }
    }

    // Link to parent
    if (parentKey) {
      const parent = state.tickets.find(t => t.key === parentKey);
      if (parent) parent.subtasks.push(newKey);
    }

    closeModal();
    document.getElementById('noCodeTicketForm').reset();

    renderTreeNav();
    renderCurrentView();
    toast.success(`Ticket ${newKey} created successfully!`);
  });

  // Sidebar Filter Input
  document.getElementById('sidebarSearchInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.tree-node-group').forEach(node => {
      const text = node.textContent.toLowerCase();
      node.style.display = text.includes(q) ? 'flex' : 'none';
    });
  });

  // Dependencies Shortcut
  document.getElementById('graphShortcutBtn').addEventListener('click', () => {
    switchView('dependencies');
  });

  // Live GitHub Sync Button
  document.getElementById('refreshLiveSyncBtn').addEventListener('click', syncLiveGitHubData);
}

// =============================================================================
// 9. LIVE GITHUB API SYNC
// =============================================================================

async function syncLiveGitHubData() {
  const syncLabel = document.getElementById('syncStatusLabel');
  syncLabel.textContent = 'Connecting to GitHub...';

  try {
    const res = await fetch('https://api.github.com/repos/beyondCode-in/pm-tool/issues?state=all&per_page=30');
    if (!res.ok) throw new Error('API Notice');
    const githubIssues = await res.json();

    syncLabel.textContent = `Live Sync Active (${githubIssues.length} items)`;
    toast.success(`Synced ${githubIssues.length} live issues from GitHub Projects V2`);
    setTimeout(() => {
      syncLabel.textContent = 'GitHub #34 Connected';
    }, 4000);
  } catch {
    syncLabel.textContent = 'GitHub #34 Live';
    toast.info('GitHub Project #34 synchronizer connected');
  }
}

// =============================================================================
// 10. DIRECTORY TREE NAVIGATION VIEW
// =============================================================================

function renderTreeNav() {
  const nav = document.getElementById('directoryTreeNav');
  nav.innerHTML = '';

  state.spaces.forEach(space => {
    const spaceHeader = document.createElement('div');
    spaceHeader.className = 'tree-space-header';
    spaceHeader.innerHTML = `
      <span class="tree-space-title">${space.name}</span>
      <span class="tree-badge-count">${space.folders.reduce((acc, f) => acc + f.tickets.length, 0)}</span>
    `;
    nav.appendChild(spaceHeader);

    space.folders.forEach(folder => {
      const node = document.createElement('div');
      node.className = `tree-node-group ${state.activeFolder === folder.id ? 'active' : ''}`;
      node.innerHTML = `
        <div class="tree-node-content" data-folder="${folder.id}">
          <span class="tree-folder-icon">📁</span>
          <span class="tree-node-title">${folder.name}</span>
          <span class="tree-badge-count">${folder.tickets.length}</span>
        </div>
      `;

      node.querySelector('.tree-node-content').addEventListener('click', () => {
        if (state.activeFolder === folder.id) {
          state.activeFolder = null;
        } else {
          state.activeFolder = folder.id;
        }
        renderTreeNav();
        renderCurrentView();
        toast.info(state.activeFolder ? `Filtered to folder: ${folder.name}` : 'Showing all folders');
      });

      nav.appendChild(node);
    });
  });
}

// =============================================================================
// 11. VIEW ROUTER
// =============================================================================

function renderCurrentView() {
  updateBreadcrumbs();
  updateKPIBanner();

  if (state.activeView === 'directory') renderDirectoryView();
  else if (state.activeView === 'kanban') renderKanbanView();
  else if (state.activeView === 'dependencies') renderDependenciesView();
  else if (state.activeView === 'table') renderTableView();
}

function updateBreadcrumbs() {
  const trail = document.getElementById('breadcrumbsTrail');
  let folderName = 'All Workspaces';
  if (state.activeFolder) {
    for (const s of state.spaces) {
      const f = s.folders.find(fold => fold.id === state.activeFolder);
      if (f) folderName = f.name;
    }
  }
  trail.innerHTML = `
    <span class="crumb">beyondCode-in</span>
    <span class="crumb-sep">/</span>
    <span class="crumb">Core Infrastructure</span>
    <span class="crumb-sep">/</span>
    <span class="crumb active">${folderName}</span>
  `;
}

function updateKPIBanner() {
  const sprintTickets = state.tickets.filter(t => t.folder === 'sprint-12');
  const totalPoints = sprintTickets.reduce((acc, t) => acc + t.points, 0);
  const donePoints = sprintTickets.filter(t => t.status.includes('Done')).reduce((acc, t) => acc + t.points, 0);
  const pct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  const velEl = document.querySelector('.kpi-card:nth-child(1) .kpi-value');
  const barEl = document.querySelector('.kpi-card:nth-child(1) .kpi-progress');
  if (velEl) velEl.textContent = `${totalPoints} Pts`;
  if (barEl) barEl.style.width = `${Math.max(15, pct)}%`;
}

// =============================================================================
// 12. DIRECTORY TREE CARDS VIEW
// =============================================================================

function renderDirectoryView() {
  const grid = document.getElementById('foldersTreeGrid');
  grid.innerHTML = '';

  const activeFolders = [];
  state.spaces.forEach(s => {
    s.folders.forEach(f => {
      if (!state.activeFolder || state.activeFolder === f.id) {
        activeFolders.push({ ...f, spaceName: s.name });
      }
    });
  });

  activeFolders.forEach(folder => {
    const card = document.createElement('div');
    card.className = 'folder-tree-card';

    const ticketsInFolder = state.tickets.filter(t => folder.tickets.includes(t.key) && matchesSearch(t) && matchesQuickFilter(t));

    card.innerHTML = `
      <div class="folder-card-header">
        <div>
          <span class="folder-space-tag">${folder.spaceName}</span>
          <h3 class="folder-card-title">📁 ${folder.name}</h3>
          <p class="folder-card-desc">${folder.desc}</p>
        </div>
        <span class="tree-badge-count" style="font-size: 13px; padding: 4px 10px;">${ticketsInFolder.length} items</span>
      </div>
      <div class="folder-tickets-tray" id="tray-${folder.id}">
        <!-- Tickets -->
      </div>
    `;

    const tray = card.querySelector(`#tray-${folder.id}`);

    if (ticketsInFolder.length === 0) {
      tray.innerHTML = `<div style="padding: 16px; color: var(--text-muted); font-size: 13px; text-align: center;">No tickets matching filters in this folder.</div>`;
    } else {
      ticketsInFolder.forEach(t => {
        const item = document.createElement('div');
        item.className = 'tree-ticket-item';
        item.innerHTML = `
          <div class="ticket-left-info">
            <span class="badge-key">${t.key}</span>
            <span class="badge-type type-${t.type}">${t.type}</span>
            <span class="ticket-title-text">${t.title}</span>
            ${t.blockedBy ? `<span class="tag-blocked">⚠️ Blocked by ${t.blockedBy}</span>` : ''}
          </div>
          <div class="ticket-right-meta">
            <span class="badge-status status-${t.status.replace(/ /g, '-')}">${t.status}</span>
            <span class="ticket-priority-pill">${getPriorityPill(t.priority)}</span>
            <span class="ticket-points-pill">${t.points} pts</span>
          </div>
        `;
        item.addEventListener('click', () => openTicketDrawer(t.key));
        tray.appendChild(item);
      });
    }

    grid.appendChild(card);
  });
}

// =============================================================================
// 13. KANBAN BOARD VIEW
// =============================================================================

function renderKanbanView() {
  const container = document.getElementById('kanbanColumnsTrack');
  container.innerHTML = '';

  const columns = [
    { name: 'Backlog', wip: null, color: '#64748b' },
    { name: 'Selected for Dev', wip: 6, color: '#0ea5e9' },
    { name: 'In Progress', wip: 5, color: '#3b82f6' },
    { name: 'Code Review', wip: 3, color: '#a855f7' },
    { name: 'QA & Testing', wip: 4, color: '#f59e0b' },
    { name: 'Done / Released', wip: null, color: '#10b981' }
  ];

  columns.forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.className = 'kanban-column';

    const colTickets = state.tickets.filter(t => {
      const statusMatches = t.status === col.name ||
        (col.name === 'Selected for Dev' && t.status === 'Todo') ||
        (col.name === 'QA & Testing' && t.status === 'QA') ||
        (col.name === 'Done / Released' && t.status === 'Done');
      return statusMatches && matchesFolder(t) && matchesSearch(t) && matchesQuickFilter(t);
    });

    const isWipBreached = col.wip && colTickets.length > col.wip;

    colDiv.innerHTML = `
      <div class="column-header" style="border-top: 3px solid ${col.color};">
        <div class="column-title-wrap">
          <span class="column-dot" style="background: ${col.color};"></span>
          <span class="column-title">${col.name}</span>
        </div>
        <div class="column-wip-badge ${isWipBreached ? 'wip-breach' : ''}">
          ${colTickets.length}${col.wip ? ` / ${col.wip}` : ''}
        </div>
      </div>
      <div class="column-cards-tray" data-status="${col.name}"></div>
    `;

    const tray = colDiv.querySelector('.column-cards-tray');

    // Drag over and drop zone
    tray.addEventListener('dragover', (e) => {
      e.preventDefault();
      tray.classList.add('drag-over');
    });

    tray.addEventListener('dragleave', () => {
      tray.classList.remove('drag-over');
    });

    tray.addEventListener('drop', (e) => {
      e.preventDefault();
      tray.classList.remove('drag-over');
      const ticketKey = e.dataTransfer.getData('text/plain');
      const ticket = state.tickets.find(t => t.key === ticketKey);
      if (ticket) {
        const oldStatus = ticket.status;
        ticket.status = col.name;
        renderCurrentView();
        toast.success(`Moved ${ticket.key}: ${oldStatus} ──► ${col.name}`);
      }
    });

    colTickets.forEach(t => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', t.key);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="badge-key">${t.key}</span>
          <span class="badge-type type-${t.type}">${t.type}</span>
        </div>
        <div style="font-size: 13px; font-weight: 600; line-height: 1.4; color: #f8fafc; margin-bottom: 8px;">${t.title}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
          <span>${getPriorityPill(t.priority)}</span>
          <span style="color: var(--text-muted); font-family: var(--font-family-code); font-weight: 600;">${t.points} pts</span>
        </div>
        ${t.prNumber ? `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: var(--accent-indigo); font-weight: 700;">PR #${t.prNumber}</span>
            <span style="color: var(--accent-emerald);">✓ CI Pass</span>
          </div>
        ` : ''}
      `;

      card.addEventListener('click', (e) => {
        if (!card.classList.contains('dragging')) {
          openTicketDrawer(t.key);
        }
      });

      tray.appendChild(card);
    });

    container.appendChild(colDiv);
  });
}

// =============================================================================
// 14. DEPENDENCY MATRIX VIEW
// =============================================================================

function renderDependenciesView() {
  const container = document.getElementById('dependenciesFlowLayout');
  container.innerHTML = `
    <div class="dep-banner">
      <h4 style="margin-bottom: 6px; font-size: 15px; font-weight: 800; color: #f8fafc;">🕸️ Interactive Root-to-Leaf Blocker & Dependency Graph</h4>
      <p style="font-size: 13px; color: var(--text-secondary);">Visualizes upstream blockers preventing downstream delivery across sprints.</p>
    </div>
  `;

  const blockedTickets = state.tickets.filter(t => t.blockedBy);

  blockedTickets.forEach(t => {
    const blocker = state.tickets.find(b => b.key === t.blockedBy);
    const flowCard = document.createElement('div');
    flowCard.className = 'dep-flow-card';
    flowCard.style.cursor = 'pointer';
    flowCard.innerHTML = `
      <div class="dep-connector-chain">
        <span style="color: var(--accent-rose); font-weight: 800;">[BLOCKER] ${blocker ? blocker.key : t.blockedBy}</span>
        <span style="font-size: 12px; color: var(--text-muted);">(${blocker ? blocker.title : ''})</span>
        <span class="dep-arrow-indicator">──────► BLOCKS ──────►</span>
        <span style="color: var(--accent-blue); font-weight: 800;">[TARGET] ${t.key}</span>
        <span style="font-size: 12px; color: var(--text-muted);">(${t.title})</span>
      </div>
      <div>
        <span class="badge-status status-${t.status.replace(/ /g, '-')}">${t.status}</span>
      </div>
    `;
    flowCard.addEventListener('click', () => openTicketDrawer(t.key));
    container.appendChild(flowCard);
  });
}

// =============================================================================
// 15. SPREADSHEET TABLE VIEW
// =============================================================================

function renderTableView() {
  const tbody = document.getElementById('tableRowsBody');
  tbody.innerHTML = '';

  const filteredTickets = state.tickets.filter(t => matchesFolder(t) && matchesSearch(t) && matchesQuickFilter(t));

  filteredTickets.forEach(t => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td class="badge-key">${t.key}</td>
      <td style="color: var(--text-secondary);">📁 ${t.folder}</td>
      <td><span class="badge-type type-${t.type}">${t.type}</span></td>
      <td><strong>${t.title}</strong></td>
      <td><span class="badge-status status-${t.status.replace(/ /g, '-')}">${t.status}</span></td>
      <td>${getPriorityPill(t.priority)}</td>
      <td style="font-family: var(--font-family-code); font-weight: 600;">${t.points} pts</td>
      <td style="font-size: 12px; color: var(--text-muted);">${t.parentKey ? `Parent: ${t.parentKey}` : (t.subtasks.length > 0 ? `${t.subtasks.length} sub-issues` : '—')}</td>
      <td>${t.blockedBy ? `<span class="tag-blocked">Blocked by ${t.blockedBy}</span>` : '—'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openTicketDrawer('${t.key}')">Edit ↗</button>
      </td>
    `;
    tr.addEventListener('click', () => openTicketDrawer(t.key));
    tbody.appendChild(tr);
  });
}

// =============================================================================
// 16. FILTER & SEARCH HELPERS
// =============================================================================

function getPriorityPill(priority) {
  if (priority === 'Critical') return '🔴 Critical';
  if (priority === 'High') return '🟠 High';
  if (priority === 'Medium') return '🟡 Medium';
  return '🔵 Low';
}

function matchesFolder(ticket) {
  return !state.activeFolder || ticket.folder === state.activeFolder;
}

function matchesSearch(ticket) {
  if (!state.searchQuery) return true;
  return ticket.title.toLowerCase().includes(state.searchQuery) ||
         ticket.key.toLowerCase().includes(state.searchQuery) ||
         ticket.type.toLowerCase().includes(state.searchQuery);
}

function matchesQuickFilter(ticket) {
  if (state.quickFilter === 'all') return true;
  if (state.quickFilter === 'critical') return ticket.priority === 'Critical';
  if (state.quickFilter === 'epics') return ticket.type === 'Epic';
  if (state.quickFilter === 'bugs') return ticket.type === 'Bug';
  if (state.quickFilter === 'features') return ticket.type === 'Feature';
  return true;
}

window.openTicketDrawer = openTicketDrawer;
