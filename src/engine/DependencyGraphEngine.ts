import { Issue } from '../types/index.ts';

export interface CircularDependencyCycle {
  issueKeys: string[];
  description: string;
}

export interface DependencyGraphAnalysis {
  hasCircularDependency: boolean;
  cycles: CircularDependencyCycle[];
  nodesCount: number;
  edgesCount: number;
}

export class DependencyGraphEngine {
  static analyzeDependencies(issues: Issue[]): DependencyGraphAnalysis {
    const adjMap = new Map<string, string[]>();
    let edgesCount = 0;

    issues.forEach(issue => {
      const blockingTargets = issue.relations
        .filter(r => r.type === 'BLOCKS' || r.type === 'DEPENDS_ON')
        .map(r => r.targetIssueKey);
      
      adjMap.set(issue.key, blockingTargets);
      edgesCount += blockingTargets.length;
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: CircularDependencyCycle[] = [];

    const dfs = (node: string, currentPath: string[]) => {
      visited.add(node);
      recStack.add(node);
      currentPath.push(node);

      const neighbors = adjMap.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...currentPath]);
        } else if (recStack.has(neighbor)) {
          const cycleStartIndex = currentPath.indexOf(neighbor);
          const cyclePath = [...currentPath.slice(cycleStartIndex), neighbor];
          cycles.push({
            issueKeys: cyclePath,
            description: `Circular dependency loop detected: ${cyclePath.join(' ──► ')}`
          });
        }
      }

      recStack.delete(node);
    };

    issues.forEach(issue => {
      if (!visited.has(issue.key)) {
        dfs(issue.key, []);
      }
    });

    return {
      hasCircularDependency: cycles.length > 0,
      cycles,
      nodesCount: issues.length,
      edgesCount
    };
  }
}
