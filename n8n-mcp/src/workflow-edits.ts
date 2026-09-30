/**
 * Applies small, targeted edits to a workflow so the model does not have to
 * resend the whole `nodes` and `connections` structures to change one node.
 */

export type Json = Record<string, unknown>;

export interface Connection {
  node: string;
  type: string;
  index: number;
}

/** connections[sourceNode][connectionType][outputIndex] = targets */
export type Connections = Record<string, Record<string, Array<Connection[] | null>>>;

export interface WorkflowGraph {
  nodes: Json[];
  connections: Connections;
}

export type EditOperation =
  | { op: "addNode"; node: Json }
  | { op: "updateNode"; name: string; changes: Json }
  | { op: "removeNode"; name: string }
  | { op: "addConnection"; from: string; to: string; fromOutput?: number; toInput?: number; type?: string }
  | { op: "removeConnection"; from: string; to: string; fromOutput?: number; toInput?: number; type?: string };

function isPlainObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Merges `patch` into `base`: nested objects are merged, anything else (including arrays) is replaced. */
export function deepMerge(base: Json, patch: Json): Json {
  const result: Json = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    result[key] = isPlainObject(value) && isPlainObject(base[key]) ? deepMerge(base[key], value) : value;
  }
  return result;
}

function findNode(graph: WorkflowGraph, name: string): Json {
  const node = graph.nodes.find((candidate) => candidate.name === name);
  if (!node) {
    const names = graph.nodes.map((candidate) => candidate.name).join(", ");
    throw new Error(`Node "${name}" not found. Existing nodes: ${names || "(none)"}`);
  }
  return node;
}

function renameInConnections(connections: Connections, from: string, to: string): Connections {
  const renamed: Connections = {};
  for (const [source, byType] of Object.entries(connections)) {
    const newByType: Connections[string] = {};
    for (const [type, outputs] of Object.entries(byType)) {
      newByType[type] = outputs.map((targets) =>
        targets ? targets.map((target) => (target.node === from ? { ...target, node: to } : target)) : targets,
      );
    }
    renamed[source === from ? to : source] = newByType;
  }
  return renamed;
}

function removeNodeFromConnections(connections: Connections, name: string): Connections {
  const cleaned: Connections = {};
  for (const [source, byType] of Object.entries(connections)) {
    if (source === name) continue;
    const newByType: Connections[string] = {};
    for (const [type, outputs] of Object.entries(byType)) {
      newByType[type] = outputs.map((targets) => (targets ? targets.filter((target) => target.node !== name) : targets));
    }
    cleaned[source] = newByType;
  }
  return cleaned;
}

function applyOne(graph: WorkflowGraph, operation: EditOperation): WorkflowGraph {
  switch (operation.op) {
    case "addNode": {
      const { node } = operation;
      if (typeof node.name !== "string" || typeof node.type !== "string") {
        throw new Error("addNode: node.name and node.type are required");
      }
      if (graph.nodes.some((candidate) => candidate.name === node.name)) {
        throw new Error(`addNode: a node named "${node.name}" already exists`);
      }
      const complete: Json = {
        id: crypto.randomUUID(),
        typeVersion: 1,
        position: [0, 0],
        parameters: {},
        ...node,
      };
      return { ...graph, nodes: [...graph.nodes, complete] };
    }

    case "updateNode": {
      const current = findNode(graph, operation.name);
      const updated = deepMerge(current, operation.changes);
      let { connections } = graph;
      const newName = updated.name;
      if (typeof newName === "string" && newName !== operation.name) {
        if (graph.nodes.some((candidate) => candidate.name === newName)) {
          throw new Error(`updateNode: cannot rename to "${newName}", that name is already used`);
        }
        connections = renameInConnections(connections, operation.name, newName);
      }
      return {
        nodes: graph.nodes.map((candidate) => (candidate === current ? updated : candidate)),
        connections,
      };
    }

    case "removeNode": {
      const current = findNode(graph, operation.name);
      return {
        nodes: graph.nodes.filter((candidate) => candidate !== current),
        connections: removeNodeFromConnections(graph.connections, operation.name),
      };
    }

    case "addConnection": {
      findNode(graph, operation.from);
      findNode(graph, operation.to);
      const type = operation.type ?? "main";
      const fromOutput = operation.fromOutput ?? 0;
      const target: Connection = { node: operation.to, type, index: operation.toInput ?? 0 };

      const byType = { ...(graph.connections[operation.from] ?? {}) };
      const outputs = [...(byType[type] ?? [])];
      while (outputs.length <= fromOutput) outputs.push([]);
      const existing = outputs[fromOutput] ?? [];
      if (existing.some((candidate) => candidate.node === target.node && candidate.index === target.index)) {
        return graph;
      }
      outputs[fromOutput] = [...existing, target];
      byType[type] = outputs;
      return { ...graph, connections: { ...graph.connections, [operation.from]: byType } };
    }

    case "removeConnection": {
      const type = operation.type ?? "main";
      const byType = graph.connections[operation.from];
      const outputs = byType?.[type];
      if (!outputs) {
        throw new Error(`removeConnection: "${operation.from}" has no ${type} connections`);
      }
      let removed = false;
      const newOutputs = outputs.map((targets, outputIndex) => {
        if (!targets || (operation.fromOutput !== undefined && operation.fromOutput !== outputIndex)) return targets;
        return targets.filter((candidate) => {
          const matches =
            candidate.node === operation.to && (operation.toInput === undefined || candidate.index === operation.toInput);
          removed ||= matches;
          return !matches;
        });
      });
      if (!removed) {
        throw new Error(`removeConnection: no connection from "${operation.from}" to "${operation.to}"`);
      }
      return { ...graph, connections: { ...graph.connections, [operation.from]: { ...byType, [type]: newOutputs } } };
    }
  }
}

export function applyEdits(graph: WorkflowGraph, operations: EditOperation[]): WorkflowGraph {
  return operations.reduce((current, operation, index) => {
    try {
      return applyOne(current, operation);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Operation #${index + 1} (${operation.op}) failed: ${message}`);
    }
  }, graph);
}
