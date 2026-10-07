export interface DependencyEdge {
  predecessorId: string;
  successorId: string;
}

/**
 * Checks if adding an edge (newPred -> newSucc) creates a directed cycle in the dependency graph.
 * Uses Depth-First Search (DFS) traversal.
 */
export function detectDependencyCycle(
  existingDependencies: DependencyEdge[],
  newPred: string,
  newSucc: string
): boolean {
  if (newPred === newSucc) {
    return true; // Self-loop
  }

  // Build adjacency list: node -> array of nodes that depend on it
  const adjList = new Map<string, string[]>();

  for (const dep of existingDependencies) {
    if (!adjList.has(dep.predecessorId)) {
      adjList.set(dep.predecessorId, []);
    }
    adjList.get(dep.predecessorId)!.push(dep.successorId);
  }

  // Add proposed edge
  if (!adjList.has(newPred)) {
    adjList.set(newPred, []);
  }
  adjList.get(newPred)!.push(newSucc);

  // DFS to check if we can reach newPred starting from newSucc
  const visited = new Set<string>();
  const stack = [newSucc];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === newPred) {
      return true; // Cycle detected: path exists from newSucc back to newPred
    }

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adjList.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return false;
}
