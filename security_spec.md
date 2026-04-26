# Security Specification - Nexus Library

## Data Invariants
1. A node must have a `parent_id`.
2. A node's `level` must be 0, 1, or 2.
3. `slug` and `title` must be non-empty strings.
4. Only authenticated users can write nodes.
5. All users can read nodes (public library).
6. `author_id` must match the creator's UID.
7. `created_at` and `updated_at` must be server timestamps.

## The Dirty Dozen Payloads (Targeting /library_nodes/{nodeId})

1. **Identity Spoofing**: `create` node with `author_id` of another user.
2. **Invalid Level**: `create` node with `level: 5`.
3. **Missing Fields**: `create` node without `slug`.
4. **Huge ID**: `create` node with a 1MB string as Document ID.
5. **Huge Content**: `create` node with 2MB of content (exceeding Firestore doc limit).
6. **Immutable Field Volatality**: `update` node and change `created_at`.
7. **Client Timestamp Injection**: `create` node with client-provided `created_at`.
8. **Shadow Field injection**: `create` node with an extra field `is_admin: true`.
9. **Unauthorized Update**: `update` node as a different user than the `author_id`.
10. **Resource Poisoning**: `create` node with `parent_id` containing malicious script tags.
11. **Negative Order**: `create` node with `order_index: -1`.
12. **Status Bypass**: (Not applicable here as there's no status, but could be 'published' later). Let's use **Empty Title**: `create` node with `title: ""`.

## Test Scenarios (Concept)
- `get` by any user -> **ALLOW**
- `list` by any user -> **ALLOW**
- `create` by unauthenticated user -> **DENY**
- `create` by auth user with valid payload -> **ALLOW**
- `update` by auth user (non-owner) -> **DENY**
- `update` by owner (changing immutable field) -> **DENY**
- `delete` by owner -> **ALLOW**
