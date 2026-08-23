export const CONSTRAINTS = [
  "CREATE CONSTRAINT graph_node_scope_id IF NOT EXISTS FOR (n:GraphNode) REQUIRE (n.scopeTenantId, n.scopeMatterId, n.id) IS UNIQUE",
  "CREATE CONSTRAINT graph_edge_scope_id IF NOT EXISTS FOR (e:GraphEdge) REQUIRE (e.scopeTenantId, e.scopeMatterId, e.id) IS UNIQUE",
];

export const INDEXES = [
  "CREATE INDEX graph_node_scope IF NOT EXISTS FOR (n:GraphNode) ON (n.scopeTenantId, n.scopeMatterId)",
  "CREATE INDEX graph_edge_scope IF NOT EXISTS FOR (e:GraphEdge) ON (e.scopeTenantId, e.scopeMatterId)",
];

export const DELETE_SCOPE_NODES = `
MATCH (n:GraphNode {scopeTenantId: $tenantId, scopeMatterId: $matterId})
DETACH DELETE n
`;

export const DELETE_SCOPE_EDGES = `
MATCH (e:GraphEdge {scopeTenantId: $tenantId, scopeMatterId: $matterId})
DELETE e
`;

export const UPSERT_NODES = `
UNWIND $nodes AS node
CREATE (n:GraphNode {
  id: node.id,
  scopeTenantId: $tenantId,
  scopeMatterId: $matterId,
  payload: node.payload
})
`;

export const UPSERT_EDGES = `
UNWIND $edges AS edge
CREATE (e:GraphEdge {
  id: edge.id,
  scopeTenantId: $tenantId,
  scopeMatterId: $matterId,
  fromId: edge.fromId,
  toId: edge.toId,
  payload: edge.payload
})
`;

export const LOAD_NODES = `
MATCH (n:GraphNode {scopeTenantId: $tenantId, scopeMatterId: $matterId})
RETURN n.payload AS payload
`;

export const LOAD_EDGES = `
MATCH (e:GraphEdge {scopeTenantId: $tenantId, scopeMatterId: $matterId})
RETURN e.payload AS payload
`;

export const LOAD_NODE = `
MATCH (n:GraphNode {scopeTenantId: $tenantId, scopeMatterId: $matterId, id: $id})
RETURN n.payload AS payload
`;

export const SCOPED_STATEMENTS = [
  DELETE_SCOPE_NODES,
  DELETE_SCOPE_EDGES,
  UPSERT_NODES,
  UPSERT_EDGES,
  LOAD_NODES,
  LOAD_EDGES,
  LOAD_NODE,
];
