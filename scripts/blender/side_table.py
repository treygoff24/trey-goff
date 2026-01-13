import bpy
import bmesh
import math
from mathutils import Matrix, Vector

# --- CONFIGURATION ---
PREFIX = "Gen_"
COLLECTION_NAME = "GeneratedAssets"

# SCALE: 2x real-world (1 unit = 0.5m in the mansion)
# Real side table: ~0.6m tall, ~0.5m wide → Scene: 1.2 units tall, 1.0 units wide
TABLE_HEIGHT = 1.2      # TWEAK: total height
TABLE_TOP_WIDTH = 1.0   # TWEAK: square top dimension
TABLE_TOP_DEPTH = 1.0
TABLE_TOP_THICKNESS = 0.08
LEG_WIDTH = 0.1
LEG_INSET = 0.08        # how far legs are from edge
SHELF_HEIGHT = 0.4      # height of lower shelf
SHELF_THICKNESS = 0.06

# Colors (mansion palette)
WOOD_COLOR = "#2a2a3a"      # dark wood matching pillars
ACCENT_COLOR = "#FFB86B"    # warm accent trim

# Export path
EXPORT_PATH = "/Users/treygoff/Code/trey-goff/public/assets/chunks/side_table.glb"

# --- CLEANUP ---
def cleanup():
    """Wipe previous generation for clean re-run."""
    if bpy.context.active_object and bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    col = bpy.data.collections.get(COLLECTION_NAME)
    if col:
        for obj in list(col.objects):
            bpy.data.objects.remove(obj, do_unlink=True)

    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        if block.name.startswith(PREFIX) and block.users == 0:
            if isinstance(block, bpy.types.Mesh):
                bpy.data.meshes.remove(block)
            elif isinstance(block, bpy.types.Material):
                bpy.data.materials.remove(block)

def get_collection():
    """Get or create output collection."""
    if COLLECTION_NAME not in bpy.data.collections:
        col = bpy.data.collections.new(COLLECTION_NAME)
        bpy.context.scene.collection.children.link(col)
    return bpy.data.collections[COLLECTION_NAME]

def activate(obj):
    """Select and activate a single object."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

# --- HELPERS ---
def hex_to_rgba(hex_str):
    h = hex_str.lstrip('#')
    return tuple(int(h[i:i+2], 16)/255 for i in (0,2,4)) + (1.0,)

def create_material(name, color_hex, roughness=0.5, metallic=0.0):
    mat = bpy.data.materials.new(PREFIX + name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_to_rgba(color_hex)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat

def create_box(name, size, location, material):
    """Create a box mesh with bevel for soft edges."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)

    # Scale to desired size
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)

    # Add bevel for realistic edges
    bmesh.ops.bevel(bm, geom=bm.edges, offset=0.01, segments=2, affect='EDGES')

    mesh = bpy.data.meshes.new(PREFIX + name)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(PREFIX + name, mesh)
    obj.location = location
    obj.data.materials.append(material)

    return obj

# --- GENERATION ---
def generate():
    cleanup()
    col = get_collection()

    # Materials
    wood_mat = create_material("Wood", WOOD_COLOR, roughness=0.7, metallic=0.1)
    accent_mat = create_material("Accent", ACCENT_COLOR, roughness=0.4, metallic=0.3)

    objects = []

    # Table top
    top_z = TABLE_HEIGHT - TABLE_TOP_THICKNESS / 2
    table_top = create_box(
        "TableTop",
        (TABLE_TOP_WIDTH, TABLE_TOP_DEPTH, TABLE_TOP_THICKNESS),
        (0, 0, top_z),
        wood_mat
    )
    objects.append(table_top)

    # Accent trim on top edge
    trim_height = 0.02
    trim = create_box(
        "TopTrim",
        (TABLE_TOP_WIDTH + 0.02, TABLE_TOP_DEPTH + 0.02, trim_height),
        (0, 0, TABLE_HEIGHT + trim_height/2),
        accent_mat
    )
    objects.append(trim)

    # Four legs
    leg_height = TABLE_HEIGHT - TABLE_TOP_THICKNESS
    leg_z = leg_height / 2
    leg_positions = [
        ( (TABLE_TOP_WIDTH/2 - LEG_INSET),  (TABLE_TOP_DEPTH/2 - LEG_INSET)),
        (-(TABLE_TOP_WIDTH/2 - LEG_INSET),  (TABLE_TOP_DEPTH/2 - LEG_INSET)),
        ( (TABLE_TOP_WIDTH/2 - LEG_INSET), -(TABLE_TOP_DEPTH/2 - LEG_INSET)),
        (-(TABLE_TOP_WIDTH/2 - LEG_INSET), -(TABLE_TOP_DEPTH/2 - LEG_INSET)),
    ]

    for i, (x, y) in enumerate(leg_positions):
        leg = create_box(
            f"Leg{i}",
            (LEG_WIDTH, LEG_WIDTH, leg_height),
            (x, y, leg_z),
            wood_mat
        )
        objects.append(leg)

    # Lower shelf
    shelf_z = SHELF_HEIGHT
    shelf_inset = LEG_INSET + LEG_WIDTH/2
    shelf = create_box(
        "Shelf",
        (TABLE_TOP_WIDTH - shelf_inset*2, TABLE_TOP_DEPTH - shelf_inset*2, SHELF_THICKNESS),
        (0, 0, shelf_z),
        wood_mat
    )
    objects.append(shelf)

    # Link all to collection
    for obj in objects:
        col.objects.link(obj)

    # Select all generated objects for export
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]

    print(f"Generated {len(objects)} objects")
    return objects

def export():
    """Export to GLB with web optimization."""
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True
    )
    print(f"Exported to: {EXPORT_PATH}")

# --- MAIN ---
if __name__ == "__main__":
    generate()
    export()
