import { describe, it, expect } from 'vitest';
import { detectDependencyCycle } from './dependency-graph.util';

describe('Dependency Cycle Detection Utility (PRJ-06)', () => {
  it('should allow linear dependencies A -> B -> C', () => {
    const existingDependencies = [
      { predecessorId: 'A', successorId: 'B' },
      { predecessorId: 'B', successorId: 'C' },
    ];

    // Adding C -> D should NOT create a cycle
    const hasCycle = detectDependencyCycle(existingDependencies, 'C', 'D');
    expect(hasCycle).toBe(false);
  });

  it('should detect a direct cycle A -> B -> A', () => {
    const existingDependencies = [{ predecessorId: 'A', successorId: 'B' }];

    // Adding B -> A creates a cycle!
    const hasCycle = detectDependencyCycle(existingDependencies, 'B', 'A');
    expect(hasCycle).toBe(true);
  });

  it('should detect an indirect cycle A -> B -> C -> A', () => {
    const existingDependencies = [
      { predecessorId: 'A', successorId: 'B' },
      { predecessorId: 'B', successorId: 'C' },
    ];

    // Adding C -> A creates a cycle!
    const hasCycle = detectDependencyCycle(existingDependencies, 'C', 'A');
    expect(hasCycle).toBe(true);
  });

  it('should detect self-dependency A -> A', () => {
    const existingDependencies: { predecessorId: string; successorId: string }[] = [];

    // Adding A -> A creates a self-loop cycle
    const hasCycle = detectDependencyCycle(existingDependencies, 'A', 'A');
    expect(hasCycle).toBe(true);
  });
});
