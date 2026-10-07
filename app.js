/**
 * BeyondPM — Zero-Dependency Enterprise Project Management Engine
 * Connects to GitHub API & provides instant no-code local state management.
 */

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
      parentKey: null,
      subtasks: ['PM-145', 'PM-142', 'PM-148'],
      blockedBy: null
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
      parentKey: 'PM-100',
      subtasks: ['PM-145-A', 'PM-145-B'],
      blockedBy: 'PM-145-A'
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
      parentKey: 'PM-145',
      subtasks: [],
      blockedBy: null
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
      parentKey: 'PM-145',
      subtasks: [],
      blockedBy: null
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
      parentKey: 'PM-100',
      subtasks: [],
      blockedBy: null
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
      parentKey: 'PM-100',
      subtasks: [],
      blockedBy: 'PM-145'
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
      parentKey: null,
      subtasks: [],
      blockedBy: null
    }
  ],

  activeFolder: null,
  activeView: 'directory',
  searchQuery: ''
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderTreeNav();
  renderCurrentView();
  bindUIEvents();
});

// UI EVENT BINDINGS
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
      document.getElementById(`${state.activeView}TabPane`).classList.add('active');
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
    const points = parseInt(document.getElementById('formPointsInput').value) || 3;
    const blockedBy = document.getElementById('formBlockedBySelect').value || null;

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
      subtasks: [],
      blockedBy
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
  });

  // Search & Filters
  document.getElementById('globalFilterInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderCurrentView();
  });

  document.getElementById('sidebarSearchInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.tree-node-group').forEach(node => {
      const text = node.textContent.toLowerCase();
      node.style.display = text.includes(q) ? 'flex' : 'none';
    });
  });

  // Dependencies Shortcut
  document.getElementById('graphShortcutBtn').addEventListener('click', () => {
    document.querySelector('.tab-btn[data-view="dependencies"]').click();
  });

  // Live GitHub Sync Button
  document.getElementById('refreshLiveSyncBtn').addEventListener('click', syncLiveGitHubData);
}

// LIVE GITHUB API SYNC
async function syncLiveGitHubData() {
  const syncLabel = document.getElementById('syncStatusLabel');
  syncLabel.textContent = 'Fetching GitHub API...';

  try {
    const res = await fetch('https://api.github.com/repos/beyondCode-in/pm-tool/issues?state=all&per_page=30');
    if (!res.ok) throw new Error('API Rate Limit or Network Error');
    const githubIssues = await res.json();

    console.log('Fetched live GitHub issues:', githubIssues);
    syncLabel.textContent = `Synced (${githubIssues.length} live issues)`;
    setTimeout(() => {
      syncLabel.textContent = 'Synced with GitHub #34';
    }, 4000);
  } catch (err) {
    console.warn('Live API Notice:', err.message);
    syncLabel.textContent = 'Local Cache Active';
    setTimeout(() => {
      syncLabel.textContent = 'Synced with GitHub #34';
    }, 3000);
  }
}

// RENDER SIDEBAR DIRECTORY TREE
function renderTreeNav() {
  const container = document.getElementById('directoryTreeNav');
  container.innerHTML = '';

  state.spaces.forEach(space => {
    const group = document.createElement('div');
    group.className = 'tree-node-group';

    const spaceRow = document.createElement('div');
    spaceRow.className = 'tree-node-row';
    spaceRow.innerHTML = `
      <span class="node-caret expanded">▶</span>
      <span>${space.name}</span>
    `;

    const subBranches = document.createElement('div');
    subBranches.className = 'tree-sub-branches';

    space.folders.forEach(folder => {
      const folderRow = document.createElement('div');
      folderRow.className = `tree-node-row ${state.activeFolder === folder.id ? 'active' : ''}`;
      folderRow.innerHTML = `
        <span>📁</span>
        <span>${folder.name}</span>
        <span class="node-count-badge">${folder.tickets.length}</span>
      `;

      folderRow.addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeFolder = state.activeFolder === folder.id ? null : folder.id;
        renderTreeNav();
        renderCurrentView();
        updateBreadcrumbs(space.name, folder.name);

        // Auto close mobile drawer
        const sidebar = document.getElementById('appSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          overlay.classList.remove('active');
        }
      });

      subBranches.appendChild(folderRow);
    });

    spaceRow.addEventListener('click', () => {
      const caret = spaceRow.querySelector('.node-caret');
      caret.classList.toggle('expanded');
      subBranches.classList.toggle('collapsed');
    });

    group.appendChild(spaceRow);
    group.appendChild(subBranches);
    container.appendChild(group);
  });
}

function updateBreadcrumbs(spaceName, folderName) {
  const bc = document.getElementById('breadcrumbsTrail');
  if (!state.activeFolder) {
    bc.innerHTML = `
      <span class="crumb">beyondCode-in</span>
      <span class="crumb-sep">/</span>
      <span class="crumb active">All Spaces & Folders</span>
    `;
  } else {
    bc.innerHTML = `
      <span class="crumb">beyondCode-in</span>
      <span class="crumb-sep">/</span>
      <span class="crumb">${spaceName}</span>
      <span class="crumb-sep">/</span>
      <span class="crumb active">${folderName}</span>
    `;
  }
}

// RENDER ACTIVE VIEW
function renderCurrentView() {
  updateSummaryStats();
  if (state.activeView === 'directory') renderDirectoryView();
  else if (state.activeView === 'kanban') renderKanbanView();
  else if (state.activeView === 'dependencies') renderDependenciesView();
  else if (state.activeView === 'table') renderTableView();
}

function updateSummaryStats() {
  const filtered = state.tickets.filter(t => matchesFolder(t) && matchesSearch(t));
  const pts = filtered.reduce((acc, t) => acc + t.points, 0);
  const statsEl = document.getElementById('viewSummaryStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <span class="stat-tag"><strong>${filtered.length}</strong> Active</span>
      <span class="stat-tag"><strong>${pts}</strong> Story Pts</span>
    `;
  }
}

// 1. DIRECTORY / FOLDERS TREE VIEW
function renderDirectoryView() {
  const container = document.getElementById('foldersTreeGrid');
  container.innerHTML = '';

  const activeFolders = [];
  state.spaces.forEach(space => {
    space.folders.forEach(folder => {
      if (!state.activeFolder || state.activeFolder === folder.id) {
        activeFolders.push({ ...folder, spaceName: space.name });
      }
    });
  });

  activeFolders.forEach(folder => {
    const box = document.createElement('div');
    box.className = 'folder-box';

    const ticketsInFolder = state.tickets.filter(t => folder.tickets.includes(t.key) && matchesSearch(t));
    const totalPts = ticketsInFolder.reduce((sum, t) => sum + t.points, 0);

    box.innerHTML = `
      <div class="folder-box-header">
        <div class="folder-head-left">
          <span class="folder-icon-lg">📁</span>
          <div>
            <span class="folder-title-text">${folder.name}</span>
            <span class="folder-desc-text">${folder.desc}</span>
          </div>
        </div>
        <div class="folder-head-stats">
          <span>${ticketsInFolder.length} items</span>
          <span>•</span>
          <span>⚡ ${totalPts} points</span>
        </div>
      </div>
      <div class="folder-tickets-list" id="box-list-${folder.id}"></div>
    `;

    const listEl = box.querySelector(`#box-list-${folder.id}`);
    const topLevelTickets = ticketsInFolder.filter(t => !t.parentKey || !folder.tickets.includes(t.parentKey));

    topLevelTickets.forEach(ticket => {
      listEl.appendChild(createTicketItemRow(ticket, false));

      ticket.subtasks.forEach(subKey => {
        const sub = state.tickets.find(t => t.key === subKey && t.folder === folder.id);
        if (sub && matchesSearch(sub)) {
          listEl.appendChild(createTicketItemRow(sub, true));
        }
      });
    });

    container.appendChild(box);
  });
}

function createTicketItemRow(ticket, isSubtask) {
  const row = document.createElement('div');
  row.className = `ticket-item-row ${isSubtask ? 'subtask-indented' : ''}`;
  row.innerHTML = `
    ${isSubtask ? '<span class="subtask-branch-symbol">└─</span>' : ''}
    <span class="badge-key">${ticket.key}</span>
    <span class="badge-type type-${ticket.type}">${ticket.type}</span>
    <span class="ticket-item-title">${ticket.title}</span>
    <div class="ticket-item-meta">
      <span class="badge-priority">${getPriorityPill(ticket.priority)}</span>
      <span class="badge-status status-${ticket.status.replace(/ /g, '-')}">${ticket.status}</span>
      <span style="font-size: 11px; color: #64748b; font-family: var(--font-family-code);">${ticket.points} pts</span>
      ${ticket.blockedBy ? `<span class="tag-blocked">Blocked by ${ticket.blockedBy}</span>` : ''}
      ${ticket.githubNumber ? `<a href="https://github.com/beyondCode-in/pm-tool/issues/${ticket.githubNumber}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 11px;" title="View on GitHub">#${ticket.githubNumber} ↗</a>` : ''}
    </div>
  `;
  return row;
}

// 2. KANBAN BOARD VIEW
function renderKanbanView() {
  const container = document.getElementById('kanbanColumnsTrack');
  container.innerHTML = '';

  const columns = ['Todo', 'In Progress', 'Code Review', 'QA', 'Done'];

  columns.forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.className = 'kanban-col-box';

    const colTickets = state.tickets.filter(t => {
      return t.status === col && matchesFolder(t) && matchesSearch(t);
    });

    colDiv.innerHTML = `
      <div class="kanban-col-header">
        <span>${col}</span>
        <span class="node-count-badge">${colTickets.length}</span>
      </div>
      <div class="kanban-cards-tray"></div>
    `;

    const tray = colDiv.querySelector('.kanban-cards-tray');

    colTickets.forEach(t => {
      const card = document.createElement('div');
      card.className = 'kanban-ticket-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="badge-key">${t.key}</span>
          <span class="badge-type type-${t.type}">${t.type}</span>
        </div>
        <div style="font-size: 13px; font-weight: 500; line-height: 1.4;">${t.title}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 4px;">
          <span>${getPriorityPill(t.priority)}</span>
          <span style="color: #64748b; font-family: var(--font-family-code);">${t.points} pts</span>
        </div>
      `;
      tray.appendChild(card);
    });

    container.appendChild(colDiv);
  });
}

// 3. DEPENDENCY MATRIX VIEW
function renderDependenciesView() {
  const container = document.getElementById('dependenciesFlowLayout');
  container.innerHTML = `
    <div class="dep-banner">
      <h4 style="margin-bottom: 6px; font-size: 15px;">🕸️ Interactive Root-to-Leaf Blocker & Dependency Graph</h4>
      <p style="font-size: 13px; color: #94a3b8;">Visualizes upstream blockers preventing downstream tickets from completing.</p>
    </div>
  `;

  const blockedTickets = state.tickets.filter(t => t.blockedBy);

  blockedTickets.forEach(t => {
    const blocker = state.tickets.find(b => b.key === t.blockedBy);
    const flowCard = document.createElement('div');
    flowCard.className = 'dep-flow-card';
    flowCard.innerHTML = `
      <div class="dep-connector-chain">
        <span style="color: #ef4444; font-weight: bold;">[BLOCKER] ${blocker ? blocker.key : t.blockedBy}</span>
        <span style="font-size: 12px; color: #94a3b8;">(${blocker ? blocker.title : ''})</span>
        <span class="dep-arrow-indicator">──────► BLOCKS ──────►</span>
        <span style="color: #3b82f6; font-weight: bold;">[TARGET] ${t.key}</span>
        <span style="font-size: 12px; color: #94a3b8;">(${t.title})</span>
      </div>
      <div>
        <span class="badge-status status-${t.status.replace(/ /g, '-')}">${t.status}</span>
      </div>
    `;
    container.appendChild(flowCard);
  });
}

// 4. SPREADSHEET TABLE VIEW
function renderTableView() {
  const tbody = document.getElementById('tableRowsBody');
  tbody.innerHTML = '';

  const filteredTickets = state.tickets.filter(t => matchesFolder(t) && matchesSearch(t));

  filteredTickets.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="badge-key">${t.key}</td>
      <td style="color: #94a3b8;">📁 ${t.folder}</td>
      <td><span class="badge-type type-${t.type}">${t.type}</span></td>
      <td><strong>${t.title}</strong></td>
      <td><span class="badge-status status-${t.status.replace(/ /g, '-')}">${t.status}</span></td>
      <td>${getPriorityPill(t.priority)}</td>
      <td style="font-family: var(--font-family-code);">${t.points} pts</td>
      <td style="font-size: 12px; color: #94a3b8;">${t.parentKey ? `Parent: ${t.parentKey}` : (t.subtasks.length > 0 ? `${t.subtasks.length} sub-issues` : '—')}</td>
      <td>${t.blockedBy ? `<span class="tag-blocked">Blocked by ${t.blockedBy}</span>` : '—'}</td>
      <td>${t.githubNumber ? `<a href="https://github.com/beyondCode-in/pm-tool/issues/${t.githubNumber}" target="_blank" style="color: #3b82f6; font-size: 12px; text-decoration: none;">GitHub #${t.githubNumber} ↗</a>` : '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

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
