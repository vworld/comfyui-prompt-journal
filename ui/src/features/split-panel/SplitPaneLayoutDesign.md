# Split Pane Design

Attempts to replicate VSCode sidebar behavior

## Behavioral Specification (the contract)

### Expand or collapse

> Prerequisite: Configured collapsedSize should be less than configured minimum size

Reference pane: Index of pane being expanded or collapsed

Collapse

- The current size is remembered.
- excessSpace is allocated to the first expanded higher-index pane.
- If none exists, allocate to the first expanded lower-index pane.

Expand

- The remembered size is the restore target.
- If insufficient space exists, the target size is clamped.
- Space reclaimed uses pane in the following order:
  - Higher-Index panes in ascending order
  - Lower-Index panes in descending order
  - Each pane contributes as much space as possible before allocation continues to the next pane.

### Pane Resize using splitter-drag

Reference splitter: splitter being dragged (splitterIndex)

- Space reclamation is restricted to panes on the shrinking side.
- Panes on the expanding side never contribute space.
- The splitter is allowed to expand a pane until
  - all panes on the shrinking side reach their minimum.

### Container resize

- Growth and shrinkage are both applied to all panes proportionately
- if all panes reach their minimum then the sidebar overflows

### Constraints

- no pane shrinks below its minimum
- requested sizes are best-effort
- if only one pane is expanded, it occupies the available space

---

## Reference Algorithm

### Collapse

```text
User clicks on header (index h)
  ↓
previousSize(h) = currentSize(h)
currentSize(h) = collapsedSize
excessSpace = currentSize - collapsedSize
  ↓
for h + 1 -> end
    ↓
  Get first expanded pane (h_after)
  ↓
if Not h_after
  ↓
  for h - 1 -> 0
     ↓
  Get first expanded pane (h_before)
  ↓ ↓
if Not h_after && Not h_before
  // all panes collapsed
  return
  ↓
h_target = h_after
if Not h_target
  h_target = h_before

newSize(h_target) = currentSize(h_target) + excessSpace

```

### Expand

```text
User clicks on header (index h)
  ↓
targetSize = previousSize
requiredSpace = targetSize - currentSize
  ↓
Get pane h + 1
for h + 1 -> end
  ↓
recoverable = Math.max(0, currentSize - minimumSize)
recoveredSpace = Math.min(recoverable, requiredSpace)
  ↓
recoveredSpace === requiredSpace
  ? commit the sizes
  : iterate over h + 1 to panes.length - 1
     ↓
   recoveredSpace < requiredSpace
     ↓
   iterate from h - 1 to 0
  ↓
expandedSize = recoveredSpace + currentSpace(h)

```

### Resize

```text
User drags splitter (index i)
  ↓
Direction: moves moves down/right (x/y increasing)
  ↓
expandingPane = paneBefore(i)
shrinkingPane = paneAfter (i+1)
  ↓
Get pane i + 1
  ↓
recoverable = Math.max(0, currentSize(i+1) - minimumSize(i+1))
recoveredSpace = Math.min(recoverable, requiredSpace)
  ↓
Same as expand, except we stop at the last pane
and do not attempt to recover from i-1
```
