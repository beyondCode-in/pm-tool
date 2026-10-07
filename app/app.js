// BeyondPM — No-Code Folderized PM Engine Data & State
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

  activeFolder: null, // null means all folders
  activeView: 'directory',
  searchQuery: ''
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderTreeNav();
  renderCurrentView();
  bindEvents();
});

// EVENT BINDINGS
function bindEvents() {
  // View Tab Switching
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      state.activeView = tab.dataset.view;
      document.getElementById(`${state.activeView}ViewPane`).classList.add('active');
      renderCurrentView();
    });
  });

  // Modal Controls
  const modal = document.getElementById('ticketModalBackdrop');
  document.getElementById('openCreateTicketModalBtn').addEventListener('click', () => {
    modal.classList.add('open');
  });
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    modal.classList.remove('open');
  });
  document.getElementById('cancelModalBtn').addEventListener('click', () => {
    modal.classList.remove('open');
  });

  // Create Ticket Form Submit (No-Code!)
  document.getElementById('createTicketForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('ticketTitle').value.trim();
    const folder = document.getElementById('ticketFolder').value;
    const parentKey = document.getElementById('ticketParent').value || null;
    const type = document.getElementById('ticketType').value;
    const priority = document.getElementById('ticketPriority').value;
    const points = parseInt(document.getElementById('ticketPoints').value) || 3;
    const blockedBy = document.getElementById('ticketBlockedBy').value || null;

    const newKey = `PM-${153 + state.tickets.length - 7}`;
    
    const newTicket = {
      key: newKey,
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

    modal.classList.remove('open');
    document.getElementById('createTicketForm').reset();
    
    renderTreeNav();
    renderCurrentView();
  });

  // Filter input
  document.getElementById('filterInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderCurrentView();
  });

  // Tree Search
  document.getElementById('treeSearchInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.tree-node').forEach(node => {
      const text = node.textContent.toLowerCase();
      node.style.display = text.includes(q) ? 'flex' : 'none';
    });
  });

  // Open Graph shortcut
  document.getElementById('openGraphBtn').addEventListener('click', () => {
    document.querySelector('.view-tab[data-view="dependencies"]').click();
  });
}

// RENDER LEFT SIDEBAR DIRECTORY TREE
function renderTreeNav() {
  const container = document.getElementById('directoryTreeNav');
  container.innerHTML = '';

  state.spaces.forEach(space => {
    const spaceNode = document.createElement('div');
    spaceNode.className = 'tree-node';

    const spaceRow = document.createElement('div');
    spaceRow.className = 'node-row';
    spaceRow.innerHTML = `
      <span class="tree-chevron expanded">▶</span>
      <span>${space.name}</span>
    `;

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'node-children';

    space.folders.forEach(folder => {
      const folderRow = document.createElement('div');
      folderRow.className = `node-row ${state.activeFolder === folder.id ? 'active' : ''}`;
      folderRow.innerHTML = `
        <span>📁</span>
        <span>${folder.name}</span>
        <span class="node-badge">${folder.tickets.length}</span>
      `;
      folderRow.addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeFolder = state.activeFolder === folder.id ? null : folder.id;
        renderTreeNav();
        renderCurrentView();
        updateBreadcrumbs(space.name, folder.name);
      });

      childrenContainer.appendChild(folderRow);
    });

    spaceRow.addEventListener('click', () => {
      const chev = spaceRow.querySelector('.tree-chevron');
      chev.classList.toggle('expanded');
      childrenContainer.classList.toggle('collapsed');
    });

    spaceNode.appendChild(spaceRow);
    spaceNode.appendChild(childrenContainer);
    container.appendChild(spaceNode);
  });
}

function updateBreadcrumbs(spaceName, folderName) {
  const bc = document.getElementById('breadcrumbsContainer');
  if (!state.activeFolder) {
    bc.innerHTML = `
      <span class="crumb">beyondCode-in</span>
      <span class="sep">/</span>
      <span class="crumb active">All Spaces & Folders</span>
    `;
  } else {
    bc.innerHTML = `
      <span class="crumb">beyondCode-in</span>
      <span class="sep">/</span>
      <span class="crumb">${spaceName}</span>
      <span class="sep">/</span>
      <span class="crumb active">${folderName}</span>
    `;
  }
}

// RENDER ACTIVE VIEW
function renderCurrentView() {
  if (state.activeView === 'directory') renderDirectoryView();
  else if (state.activeView === 'kanban') renderKanbanView();
  else if (state.activeView === 'dependencies') renderDependenciesView();
  else if (state.activeView === 'table') renderTableView();
}

// 1. DIRECTORY / FOLDER VIEW
function renderDirectoryView() {
  const container = document.getElementById('folderGridContainer');
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
    const card = document.createElement('div');
    card.className = 'folder-card';

    const ticketsInFolder = state.tickets.filter(t => folder.tickets.includes(t.key) && matchesSearch(t));
    const totalPts = ticketsInFolder.reduce((sum, t) => sum + t.points, 0);

    card.innerHTML = `
      <div class="folder-header">
        <div class="folder-title-area">
          <span class="folder-icon">📁</span>
          <div>
            <span class="folder-name">${folder.name}</span>
            <span class="folder-desc">${folder.desc}</span>
          </div>
        </div>
        <div class="folder-stats">
          <span>${ticketsInFolder.length} items</span>
          <span>•</span>
          <span>⚡ ${totalPts} points</span>
        </div>
      </div>
      <div class="ticket-list" id="list-${folder.id}">
      </div>
    `;

    const listContainer = card.querySelector(`#list-${folder.id}`);
    
    // Render top-level tickets first, then nested subtasks
    const topTickets = ticketsInFolder.filter(t => !t.parentKey || !folder.tickets.includes(t.parentKey));

    topTickets.forEach(ticket => {
      listContainer.appendChild(createTicketRow(ticket, false));

      // If ticket has subtasks in this folder, render indented
      ticket.subtasks.forEach(subKey => {
        const sub = state.tickets.find(t => t.key === subKey && t.folder === folder.id);
        if (sub && matchesSearch(sub)) {
          listContainer.appendChild(createTicketRow(sub, true));
        }
      });
    });

    container.appendChild(card);
  });
}

function createTicketRow(ticket, isSubtask) {
  const row = document.createElement('div');
  row.className = `ticket-row ${isSubtask ? 'subtask-indent' : ''}`;
  row.innerHTML = `
    ${isSubtask ? '<span class="subtask-connector">└─</span>' : ''}
    <span class="ticket-key">${ticket.key}</span>
    <span class="ticket-type-badge type-${ticket.type}">${ticket.type}</span>
    <span class="ticket-title">${ticket.title}</span>
    <div class="ticket-meta">
      <span class="priority-pill">${getPriorityBadge(ticket.priority)}</span>
      <span class="status-pill status-${ticket.status.replace(/ /g, '-')}">${ticket.status}</span>
      <span style="font-size: 11px; color: #8b949e;">${ticket.points} pts</span>
      ${ticket.blockedBy ? `<span style="font-size: 11px; color: #ef4444; background: #451a1a; padding: 2px 6px; border-radius: 4px;">Blocked by ${ticket.blockedBy}</span>` : ''}
    </div>
  `;
  return row;
}

// 2. KANBAN BOARD VIEW
function renderKanbanView() {
  const container = document.getElementById('kanbanBoardContainer');
  container.innerHTML = '';

  const columns = ['Todo', 'In Progress', 'Code Review', 'QA', 'Done'];

  columns.forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.className = 'kanban-column';

    const colTickets = state.tickets.filter(t => {
      const folderMatch = !state.activeFolder || t.folder === state.activeFolder;
      return t.status === col && folderMatch && matchesSearch(t);
    });

    colDiv.innerHTML = `
      <div class="kanban-column-header">
        <span>${col}</span>
        <span class="node-badge">${colTickets.length}</span>
      </div>
      <div class="kanban-column-cards"></div>
    `;

    const cardsContainer = colDiv.querySelector('.kanban-column-cards');

    colTickets.forEach(t => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="ticket-key">${t.key}</span>
          <span class="ticket-type-badge type-${t.type}">${t.type}</span>
        </div>
        <div style="font-size: 13px; font-weight: 500;">${t.title}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 4px;">
          <span>${getPriorityBadge(t.priority)}</span>
          <span style="color: #8b949e;">${t.points} pts</span>
        </div>
      `;
      cardsContainer.appendChild(card);
    });

    container.appendChild(colDiv);
  });
}

// 3. DEPENDENCY MATRIX VIEW
function renderDependenciesView() {
  const container = document.getElementById('dependencyContainer');
  container.innerHTML = `
    <div style="background: #161b22; padding: 16px 20px; border-radius: 8px; border: 1px solid #30363d; margin-bottom: 12px;">
      <h4 style="margin-bottom: 6px;">🕸️ Interactive Root-to-Leaf Blocker & Dependency Graph</h4>
      <p style="font-size: 13px; color: #8b949e;">Visualizes upstream blockers preventing downstream tickets from completing.</p>
    </div>
  `;

  const blockedTickets = state.tickets.filter(t => t.blockedBy);

  blockedTickets.forEach(t => {
    const blocker = state.tickets.find(b => b.key === t.blockedBy);
    const node = document.createElement('div');
    node.className = 'dep-node-card';
    node.innerHTML = `
      <div class="dep-chain">
        <span style="color: #ef4444; font-weight: bold;">[BLOCKER] ${blocker ? blocker.key : t.blockedBy}</span>
        <span style="font-size: 12px; color: #8b949e;">(${blocker ? blocker.title : ''})</span>
        <span class="dep-arrow">────────► BLOCKS ────────►</span>
        <span style="color: #58a6ff; font-weight: bold;">[TARGET] ${t.key}</span>
        <span style="font-size: 12px; color: #8b949e;">(${t.title})</span>
      </div>
      <div>
        <span class="status-pill status-${t.status.replace(/ /g, '-')}">${t.status}</span>
      </div>
    `;
    container.appendChild(node);
  });
}

// 4. SPREADSHEET TABLE VIEW
function renderTableView() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  const filteredTickets = state.tickets.filter(t => {
    const folderMatch = !state.activeFolder || t.folder === state.activeFolder;
    return folderMatch && matchesSearch(t);
  });

  filteredTickets.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="ticket-key">${t.key}</td>
      <td style="color: #8b949e;">📁 ${t.folder}</td>
      <td><span class="ticket-type-badge type-${t.type}">${t.type}</span></td>
      <td><strong>${t.title}</strong></td>
      <td><span class="status-pill status-${t.status.replace(/ /g, '-')}">${t.status}</span></td>
      <td>${getPriorityBadge(t.priority)}</td>
      <td>${t.points} pts</td>
      <td style="font-size: 12px; color: #8b949e;">${t.parentKey ? `Parent: ${t.parentKey}` : (t.subtasks.length > 0 ? `${t.subtasks.length} subtasks` : '—')}</td>
      <td>${t.blockedBy ? `<span style="color: #ef4444;">Blocked by ${t.blockedBy}</span>` : '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function getPriorityBadge(priority) {
  if (priority === 'Critical') return '🔴 Critical';
  if (priority === 'High') return '🟠 High';
  if (priority === 'Medium') return '🟡 Medium';
  return '🔵 Low';
}

function matchesSearch(ticket) {
  if (!state.searchQuery) return true;
  return ticket.title.toLowerCase().includes(state.searchQuery) ||
         ticket.key.toLowerCase().includes(state.searchQuery) ||
         ticket.type.toLowerCase().includes(state.searchQuery);
}
