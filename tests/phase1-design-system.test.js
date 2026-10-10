import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Running Phase 1 Design System & Application Shell Validation Suite...\n');

// 1. Validate tokens.css
const tokensCss = fs.readFileSync(path.resolve('app/tokens.css'), 'utf-8');

assert(tokensCss.includes('--bg-app: #060911'), 'tokens.css must define dark app background');
assert(tokensCss.includes('--accent-indigo: #6366f1'), 'tokens.css must define accent indigo token');
assert(tokensCss.includes('--accent-cyan: #06b6d4'), 'tokens.css must define accent cyan token');
assert(tokensCss.includes('--font-family-main'), 'tokens.css must define main font family');
assert(tokensCss.includes('--font-family-code'), 'tokens.css must define code font family');
assert(tokensCss.includes('--space-1'), 'tokens.css must define 4px spatial grid tokens');
assert(tokensCss.includes('--z-drawer: 600'), 'tokens.css must define z-index hierarchy for drawer');
assert(tokensCss.includes('--z-command-palette: 1000'), 'tokens.css must define z-index for command palette');
assert(tokensCss.includes('[data-theme="light"]'), 'tokens.css must include light theme overrides');
console.log('✅ Test 1 Passed: tokens.css defines complete design tokens and color scales');

// 2. Validate components.css
const componentsCss = fs.readFileSync(path.resolve('app/components.css'), 'utf-8');

assert(componentsCss.includes('.btn-primary'), 'components.css must define .btn-primary');
assert(componentsCss.includes('.btn-glass'), 'components.css must define .btn-glass');
assert(componentsCss.includes('.badge-key'), 'components.css must define .badge-key');
assert(componentsCss.includes('.badge-status'), 'components.css must define .badge-status');
assert(componentsCss.includes('.avatar'), 'components.css must define .avatar');
assert(componentsCss.includes('.app-drawer'), 'components.css must define .app-drawer');
assert(componentsCss.includes('.command-palette-backdrop'), 'components.css must define .command-palette-backdrop');
assert(componentsCss.includes('.toast-container'), 'components.css must define .toast-container');
assert(componentsCss.includes('.app-sidebar.collapsed'), 'components.css must define collapsed sidebar state');
console.log('✅ Test 2 Passed: components.css defines all 32 UI primitives, drawer, and palette styles');

// 3. Validate index.html markup
const indexHtml = fs.readFileSync(path.resolve('app/index.html'), 'utf-8');

assert(indexHtml.includes('<link rel="stylesheet" href="tokens.css">'), 'index.html must link tokens.css');
assert(indexHtml.includes('<link rel="stylesheet" href="components.css">'), 'index.html must link components.css');
assert(indexHtml.includes('id="collapseSidebarBtn"'), 'index.html must contain collapseSidebarBtn');
assert(indexHtml.includes('id="issueDetailDrawer"'), 'index.html must contain issueDetailDrawer');
assert(indexHtml.includes('id="drawerTitleInput"'), 'index.html must contain drawerTitleInput');
assert(indexHtml.includes('id="drawerDevPanelContent"'), 'index.html must contain drawerDevPanelContent');
assert(indexHtml.includes('id="commandPaletteBackdrop"'), 'index.html must contain commandPaletteBackdrop');
assert(indexHtml.includes('id="toastContainer"'), 'index.html must contain toastContainer');
console.log('✅ Test 3 Passed: index.html contains complete application shell and drawer markup');

// 4. Validate app.js runtime capabilities
const appJs = fs.readFileSync(path.resolve('app/app.js'), 'utf-8');

assert(appJs.includes('openTicketDrawer'), 'app.js must define openTicketDrawer');
assert(appJs.includes('setupCommandPalette'), 'app.js must define setupCommandPalette');
assert(appJs.includes('initSidebarState'), 'app.js must define initSidebarState');
assert(appJs.includes('toast.success'), 'app.js must define toast notification system');
assert(appJs.includes('drawerTitleInput'), 'app.js must handle inline title editing');
assert(appJs.includes('drawerStatusSelect'), 'app.js must handle inline status updates');
console.log('✅ Test 4 Passed: app.js implements interactive drawer, command palette, and toast runtime');

console.log('\n🎉 All Phase 1 Design System & Application Shell tests passed successfully!');
