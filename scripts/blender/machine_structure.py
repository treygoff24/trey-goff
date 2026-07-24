"""Generate the /machine structure mesh: a stepped tower silhouette.

Run headless, reproducibly:

    blender -b -P scripts/blender/machine_structure.py

Writes assets-src/machine-structure.glb. Optimize and validate with:

    pnpm assets:optimize -- assets-src/machine-structure.glb public/machine/structure.glb safe
    pnpm assets:validate

Design constraints, all load-bearing:

* Footprint fits a 1x1 cell, base sits at y=0. MachineWorld scales this by
  (0.48*cell, height, 0.48*cell), so the mesh must be a unit block anchored at
  its base or every building sinks into the ground plane.
* Vertical scale must read as "more stories", not as a stretched roof. That is
  why the form is a stepped shaft with setbacks rather than a house with a
  gable: stretching a gable looks broken, stretching a shaft looks taller.
* Geometry only, no materials or vertex colors. The renderer drives colour
  through instanceColor on a meshBasicMaterial, and baked-in colour would
  multiply against it and break the single-green palette.
* Low poly on purpose. This draws at up to 15,000 instances, so the triangle
  count here is multiplied by 15,000 on a high-tier machine.
"""

import bpy
import bmesh

OUTPUT = "assets-src/machine-structure.glb"

# Setbacks as (height_fraction_start, half_width). Each tier is narrower than
# the one below it, so the silhouette tapers as it rises.
TIERS = [
    (0.00, 0.50),
    (0.55, 0.42),
    (0.82, 0.31),
]
SPIRE_HEIGHT = 0.06
SPIRE_HALF_WIDTH = 0.08


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def build_mesh():
    mesh = bpy.data.meshes.new("MachineStructure")
    bm = bmesh.new()

    for index, (start, half) in enumerate(TIERS):
        end = TIERS[index + 1][0] if index + 1 < len(TIERS) else 1.0
        bmesh.ops.create_cube(bm, size=1.0, matrix=_box(start, end, half))

    # A slim spire above the top tier. It reads as intent at a distance, which
    # is what separates a skyline from a bar chart.
    bmesh.ops.create_cube(
        bm,
        size=1.0,
        matrix=_box(1.0, 1.0 + SPIRE_HEIGHT, SPIRE_HALF_WIDTH),
    )

    # Merge coincident tier faces so the shaft is one solid, then drop the
    # interior geometry the merge leaves behind.
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(mesh)
    bm.free()

    mesh.shade_flat()
    return mesh


def _box(bottom, top, half):
    from mathutils import Matrix

    height = top - bottom
    centre = Matrix.Translation((0.0, 0.0, bottom + height * 0.5))
    scale = Matrix.Diagonal((half * 2.0, half * 2.0, height, 1.0))
    return centre @ scale


def main():
    clear_scene()
    mesh = build_mesh()
    obj = bpy.data.objects.new("LOD0_STRUCTURE", mesh)
    bpy.context.collection.objects.link(obj)

    # glTF is Y-up, Blender is Z-up. The exporter converts, so the mesh is
    # authored Z-up here and lands Y-up with its base at y=0 in three.js.
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT,
        export_format="GLB",
        export_materials="NONE",
        export_normals=True,
        export_texcoords=False,
        export_yup=True,
        use_selection=False,
    )

    tris = sum(len(polygon.vertices) - 2 for polygon in mesh.polygons)
    print(f"machine_structure: {len(mesh.vertices)} verts, {tris} tris -> {OUTPUT}")


if __name__ == "__main__":
    main()
