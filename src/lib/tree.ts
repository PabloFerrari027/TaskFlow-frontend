// The API returns hierarchies (projects, sections, comments) as flat lists
// with a `parentId`. These helpers rebuild the tree client-side from the list
// already in cache, so no extra request is needed to render or validate it.

export interface TreeItem {
  id: string;
  parentId: string | null;
}

export interface TreeNode<T extends TreeItem> {
  item: T;
  children: TreeNode<T>[];
}

/**
 * Builds a forest from a flat list. An item whose parent isn't in `items`
 * (filtered out, or beyond a truncated page) is treated as a root rather than
 * dropped, so nothing silently disappears from the UI. Sibling order follows
 * the order of `items`.
 */
export function buildTree<T extends TreeItem>(items: T[]): TreeNode<T>[] {
  const nodes = new Map<string, TreeNode<T>>(
    items.map((item) => [item.id, { item, children: [] }])
  );
  const roots: TreeNode<T>[] = [];

  for (const node of nodes.values()) {
    const parent = node.item.parentId ? nodes.get(node.item.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
}

/** Depth-first (parents before children) flattening of a forest. */
export function flattenTree<T extends TreeItem>(nodes: TreeNode<T>[]): T[] {
  return nodes.flatMap((node) => [node.item, ...flattenTree(node.children)]);
}

/** Ids of every descendant of `id` (children, grandchildren, …), excluding `id` itself. */
export function collectDescendantIds<T extends TreeItem>(items: T[], id: string): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    const siblings = childrenByParent.get(item.parentId) ?? [];
    siblings.push(item.id);
    childrenByParent.set(item.parentId, siblings);
  }

  const descendants = new Set<string>();
  const queue = [...(childrenByParent.get(id) ?? [])];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    if (descendants.has(current)) continue;
    descendants.add(current);
    queue.push(...(childrenByParent.get(current) ?? []));
  }
  return descendants;
}

/** Ancestors of `id` ordered from the root down to its direct parent. */
export function getAncestors<T extends TreeItem>(items: T[], id: string): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ancestors: T[] = [];
  const seen = new Set<string>([id]);

  let current = byId.get(id);
  while (current?.parentId && !seen.has(current.parentId)) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    seen.add(parent.id);
    current = parent;
  }
  return ancestors;
}
