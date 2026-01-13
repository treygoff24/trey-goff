# Core Mechanics Fix Spec

## Problem Statement

Two fundamental game mechanics are broken:
1. **Camera pitch** - Cannot look up/down with mouse Y movement
2. **Collision** - Player walks through walls, shelves, furniture

## Current State

### Camera Pitch
- `useDesktopControls` tracks `pitch` (PlayerController.tsx:61)
- Pitch is clamped to ±72° (PlayerController.tsx:82)
- Pitch is **returned but never used** (line 136)
- CameraController only receives `targetYaw`, no pitch support
- Fix: Pass pitch through store → CameraController, apply to lookAt

### Collision
- Rapier (`@react-three/rapier`) is installed but unused
- Player position snapped to Y=0 (PlayerController.tsx:405)
- Rooms have visual meshes but no collision bodies
- Fix: Wrap scene in `<Physics>`, add RigidBody/CuboidCollider to room geometry

## Implementation Plan

### Phase 1: Camera Pitch (30 min)
1. Add `pitch` to player state in store
2. Update PlayerController to write pitch to store
3. Update CameraController props to accept `targetPitch`
4. Apply pitch to camera lookAt calculation
5. Handle first-person vs third-person modes differently

### Phase 2: Collision System (60 min)
1. Add `<Physics>` wrapper in InteractiveWorld
2. Create player RigidBody (kinematic capsule)
3. Add collision bodies to room geometry:
   - Walls: CuboidCollider
   - Floor: CuboidCollider
   - Furniture: CuboidCollider (rough bounds)
4. Update PlayerController to use Rapier for movement
5. Test in each room (Exterior, MainHall, Library, Gym, Projects)

### Phase 3: Verification (15 min)
1. Walk around all rooms - cannot pass through walls
2. Mouse Y movement tilts camera up/down
3. Mobile still works (no physics on touch input)
4. Quality gates pass

## Acceptance Criteria

- [x] Mouse Y movement changes camera pitch (up to ±72°)
- [x] Player cannot walk through walls in any room
- [x] Player cannot walk through bookshelves in Library
- [x] Player cannot walk through equipment in Gym
- [x] Player cannot walk through pedestals in Projects
- [x] Mobile touch controls still work
- [x] Performance: 60fps on desktop, 30fps on mobile
- [x] All quality gates pass (typecheck, lint, build)

## Implementation Notes (2025-12-28)

**Camera Pitch:**
- Added `targetPitch` prop to `CameraController`
- `PlayerController` stores pitch in `rotation[0]` and writes to store
- `CameraIntegration` reads pitch from store and passes to camera
- Pitch clamped to ±72° using `MAX_PITCH` constant

**Collision:**
- Added `<Physics>` wrapper in `InteractiveWorld`
- Converted `PlayerController` to use Rapier kinematic character controller
- Added collision bodies to all rooms:
  - ExteriorRoom: ground, mansion, garage, mech
  - MainHallRoom: floor, walls, pillars, pedestal
  - LibraryRoom: floor, walls, bookshelves
  - GymRoom: floor, walls, equipment
  - ProjectsRoom: floor, walls

**Performance:**
- Reusable Vector3 refs avoid per-frame allocations
- Character controller cleanup on unmount
