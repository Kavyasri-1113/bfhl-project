const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  let invalid_entries = [];
  let duplicate_edges = [];
  let seen = new Set();
  let edges = [];

  for (let item of data) {
    if (!item) continue;

    item = item.trim();

    const valid = /^[A-Z]->[A-Z]$/.test(item) && item[0] !== item[3];

    if (!valid) {
      invalid_entries.push(item);
      continue;
    }

    if (seen.has(item)) {
      if (!duplicate_edges.includes(item)) {
        duplicate_edges.push(item);
      }
      continue;
    }

    seen.add(item);
    edges.push(item);
  }

  let adj = {};
  let childSet = new Set();

  edges.forEach(e => {
    let [p, c] = e.split("->");

    if (!adj[p]) adj[p] = [];
    adj[p].push(c);

    childSet.add(c);
  });

  let nodes = new Set([...Object.keys(adj), ...childSet]);
  let roots = [...nodes].filter(n => !childSet.has(n));

  let hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let maxDepth = 0;
  let largest_tree_root = "";

  function dfs(node, visited, stack) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (let nei of (adj[node] || [])) {
      if (dfs(nei, visited, stack)) return true;
    }

    stack.delete(node);
    return false;
  }

  function buildTree(node) {
    let obj = {};
    for (let child of (adj[node] || [])) {
      obj[child] = buildTree(child);
    }
    return obj;
  }

  function getDepth(node) {
    if (!adj[node] || adj[node].length === 0) return 1;
    let depths = adj[node].map(getDepth);
    return 1 + Math.max(...depths);
  }

  for (let root of roots) {
    let visited = new Set();
    let stack = new Set();

    let hasCycle = dfs(root, visited, stack);

    if (hasCycle) {
      total_cycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      total_trees++;
      let tree = {};
      tree[root] = buildTree(root);
      let depth = getDepth(root);

      if (depth > maxDepth || (depth === maxDepth && root < largest_tree_root)) {
        maxDepth = depth;
        largest_tree_root = root;
      }

      hierarchies.push({
        root,
        tree,
        depth
      });
    }
  }

  res.json({
    user_id: "kavyasri_11052005",
    email_id: "km0707@srmist.edu.in",
    college_roll_number: "RA2311026011063",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));