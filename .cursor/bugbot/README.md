# Bugbot Rules for Grafana Dashboard Scene

This directory contains Bugbot rules that help catch common issues in the Grafana dashboard scene codebase.

## Overview

The rules defined in `rules.yml` focus on catching performance and correctness issues related to React component state management in the Scene architecture.

## Key Rules

### 1. Scene useState causing unnecessary re-renders

**Severity:** Medium

**What it catches:** Components that call `.useState()` on Scene objects will re-render whenever ANY state in that object changes, not just the specific properties being accessed.

**Example issue:**
```typescript
// ❌ Bad: Will re-render on ANY dashboard state change
const { isEditing } = dashboard.useState();
if (!isEditing) return null;
```

**Why it matters:** When a component calls `dashboard.useState()` or similar Scene object state subscriptions, it subscribes to all state changes on that object. This can cause unnecessary re-renders and performance issues, especially in frequently rendered components like panels or grid items.

### 2. React hook called after conditional return

**Severity:** High

**What it catches:** React hooks (like `useState()`) being called after conditional returns, which violates React's Rules of Hooks.

**Example issue:**
```typescript
// ❌ Bad: Hook called after conditional return
if (!model.parent) {
  return null;
}
const { isEditing } = dashboard.useState(); // Violates Rules of Hooks
```

**Why it matters:** This can cause runtime errors like "Rendered more hooks than during the previous render" if the condition ever changes during the component lifecycle.

**Fix:**
```typescript
// ✅ Good: Hook called before conditional
const { isEditing } = dashboard.useState();
if (!model.parent) {
  return null;
}
```

### 3. State subscriptions in conditionally rendered components

**Severity:** Medium

**What it catches:** Components that are conditionally rendered but subscribe to state changes can cause unnecessary computation and re-renders even when they're not visible in the UI.

**Example issue:**
```typescript
// ❌ Bad: Subscribes to state even when hidden
const { isEditing } = dashboard.useState();
if (!isEditing) return null; // Component subscribes even when hidden
```

### 4. Dashboard state in frequently rendered components

**Severity:** Medium

**What it catches:** Components that render frequently (like panel components, grid items, etc.) subscribing to dashboard-level state.

**Why it matters:** Dashboard state changes can be frequent (on every edit action, selection change, etc.). Subscribing to it in frequently-rendered components can cause performance issues.

### 5. Missing state cleanup

**Severity:** Medium

**What it catches:** State that affects visual rendering (like search highlighting, selection states, etc.) not being properly cleaned up when the component unmounts or when the mode changes.

**Example issue:** Panel search highlighting should be cleared when exiting edit mode, otherwise the visual effects (green outlines, reduced opacity) will persist incorrectly.

## Configuration

The rules are configured to:
- Run on all pull requests
- Run on commits
- Focus on the `public/app/features/dashboard-scene/` directory

## Adding New Rules

To add new rules:

1. Edit `rules.yml`
2. Follow the existing pattern with:
   - `id`: Unique identifier
   - `name`: Human-readable name
   - `severity`: low, medium, or high
   - `description`: Detailed explanation
   - `pattern`: Pattern matching configuration

## Testing Rules

After adding or modifying rules, test them by:

1. Running Bugbot on an existing PR or commit
2. Verifying the rule catches the intended issues
3. Ensuring minimal false positives

## Related Documentation

- [React Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
- [Grafana Scenes Documentation](https://github.com/grafana/scenes)
