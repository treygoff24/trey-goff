# Bug Report: Severe GPU Performance Issues on /library

## Summary
Opening the `/library` page instantly maxes out GPU usage, even on high-end hardware.

## Status: FIXED ✅

### Root Causes Identified and Fixed

#### 1. Continuous Rendering at 60+ FPS (PRIMARY)
**Problem:** Canvas defaulted to `frameloop="always"`, rendering every frame even when nothing changed.

**Fix:** Changed to `frameloop="demand"` - now only renders when `invalidate()` is called.

```typescript
// FloatingLibrary.tsx:174
<Canvas
  dpr={[1, 2]}
  frameloop="demand" // Only render when invalidated
  ...
>
```

#### 2. Continuous Animations in Every useFrame Hook (PRIMARY)
**Problem:** Multiple components had continuous animations running every frame:
- StarField: 2000 stars twinkling every frame
- FloatingBook: 150+ books with floating animation every frame
- NebulaCloud: 40+ nebulae breathing every frame
- StatsGlow: Pulsing animation every frame

**Fix:** Removed all continuous animations. Components are now static with on-demand updates:
- StarField: Static stars with varying brightness (no animation)
- FloatingBook: Only animates during position/scale transitions, then stops
- NebulaCloud: Static glow (no breathing)
- StatsGlow: Static opacity (no pulsing)

#### 3. CORS Blocking All Cover Images (SECONDARY)
**Problem:** Google Books URLs don't return CORS headers, so all 150+ covers fail to load.

**Mitigation:** Added placeholder texture caching by topic. Instead of 150+ placeholder textures, now creates ~15 (one per topic).

**Long-term fix needed:** Host covers locally with CORS headers.

#### 4. No DPR Cap (MINOR)
**Problem:** High-DPI displays rendered at full pixel ratio.

**Fix:** Added `dpr={[1, 2]}` to cap at 2x.

---

## Files Changed

1. `components/library/floating/FloatingLibrary.tsx` - Added frameloop="demand" and dpr cap
2. `components/library/floating/StarField.tsx` - Removed twinkle animation
3. `components/library/floating/NebulaCloud.tsx` - Removed breathing animation
4. `components/library/floating/FloatingBook.tsx` - Removed continuous float, added invalidate() for transitions
5. `components/library/floating/CameraController.tsx` - Added invalidate() during transitions
6. `components/library/floating/StatsConstellation.tsx` - Removed StatsGlow animation
7. `lib/library/textures.ts` - Added placeholder caching by topic

---

## How On-Demand Rendering Works Now

1. **Initial load:** Scene renders once, GPU idles
2. **User hovers book:** Book triggers invalidate() → smooth scale animation → GPU idles
3. **User clicks book:** Camera transition triggers invalidate() continuously until complete → GPU idles
4. **Filters change:** Book positions update with invalidate() → GPU idles

The scene is now **static by default** with animations only during interactions.

---

## Remaining Work

1. Host book covers locally with CORS headers (eliminates 150+ failed network requests)
2. Consider adding very subtle animations back with severe throttling (e.g., nebula breathe once every 5 seconds)
