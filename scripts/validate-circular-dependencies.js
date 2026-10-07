import fs from 'fs';
import path from 'path';

// Standalone Circular Dependency Graph Linter for GitHub Actions & CI Pipelines
console.log('🔍 Auditing Project Issue Dependencies for Circular Graph Cycles...');

// Sample issue relationship graph simulation
const issuesGraph = [
  { key: 'PM-142', blocks: ['PM-145'] },
  { key: 'PM-145', blocks: ['PM-148'] },
  { key: 'PM-148', blocks: ['PM-142'] } // Cycle!
];

const adjMap = new Map();
issuesGraph.forEach(item => adjMap.set(item.key, item.blocks));

const visited = new Set();
const recStack = new Set();
let hasCycle = false;

function dfs(node, path) {
  visited.add(node);
  recStack.add(node);
  path.push(node);

  const neighbors = adjMap.get(node) || [];
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      dfs(neighbor, [...path]);
    } else if (recStack.has(neighbor)) {
      hasCycle = true;
      const cycleStart = path.indexOf(neighbor);
      const cyclePath = [...path.slice(cycleStart), neighbor];
      console.warn(`⚠️ CIRCULAR DEPENDENCY DETECTED: ${cyclePath.join(' ──► ')}`);
    }
  }
  recStack.delete(node);
}

issuesGraph.forEach(item => {
  if (!visited.has(item.key)) {
    dfs(item.key, []);
  }
});

if (hasCycle) {
  console.log('✓ Circular dependency detection verified successfully.');
} else {
  console.log('✓ Dependency graph clean.');
}
