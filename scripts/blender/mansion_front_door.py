#!/usr/bin/env python3
"""
Mansion Front Door - Grand Double Doors
Simplified design with proper alignment
"""
import bpy
import sys
import json
import math
from mathutils import Vector

OUTPUT_DIR = "/tmp"
ASSET_NAME = "mansion_front_door"

# Dimensions (meters)
DOOR_WIDTH = 0.95       # Each door panel
DOOR_HEIGHT = 2.5       # Door height
DOOR_THICK = 0.05       # Door thickness
FRAME_W = 0.10          # Frame width
FRAME_D = 0.15          # Frame depth (goes back into wall)

def parse_args():
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
    else:
        args = []
    result = {}
    for a in args:
        if "=" in a:
            k, v = a.split("=", 1)
            result[k.lstrip("-")] = v
    return result

def cleanup():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, color, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    if isinstance(color, str):
        h = color.lstrip('#')
        color = tuple(int(h[i:i+2], 16)/255 for i in (0,2,4))
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m

def box(name, sz, loc, material=None):
    # primitive_cube_add(size=1) creates a 1x1x1 cube (edge length 1)
    # Scale to desired dimensions
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (sz[0], sz[1], sz[2])
    bpy.ops.object.transform_apply(scale=True)
    if material:
        o.data.materials.append(material)
    return o

def cyl(name, r, d, loc, rot=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return o

def generate():
    cleanup()

    # Materials
    dark_wood = mat("DarkWood", "#1A0E08", rough=0.75)
    frame_wood = mat("Frame", "#251510", rough=0.7)
    bronze = mat("Bronze", "#5D4E3D", rough=0.4, metal=0.85)
    gold = mat("Gold", "#9D8A6F", rough=0.3, metal=0.9)

    # Calculate positions
    # Doors sit at Y=0, frame wraps around them
    # Total opening = 2 * DOOR_WIDTH
    opening = DOOR_WIDTH * 2
    total_w = opening + FRAME_W * 2

    parts = []

    # === FRAME (behind and around doors) ===
    # Frame Y center (behind doors)
    fy = -FRAME_D/2

    # Left jamb - positioned so inner edge touches door
    left_jamb = box("Frame_L", (FRAME_W, FRAME_D, DOOR_HEIGHT + FRAME_W),
                    (-opening/2 - FRAME_W/2, fy, (DOOR_HEIGHT + FRAME_W)/2), frame_wood)
    parts.append(left_jamb)

    # Right jamb
    right_jamb = box("Frame_R", (FRAME_W, FRAME_D, DOOR_HEIGHT + FRAME_W),
                     (opening/2 + FRAME_W/2, fy, (DOOR_HEIGHT + FRAME_W)/2), frame_wood)
    parts.append(right_jamb)

    # Top header - connects the jambs
    header = box("Frame_Top", (total_w, FRAME_D, FRAME_W),
                 (0, fy, DOOR_HEIGHT + FRAME_W/2), frame_wood)
    parts.append(header)

    # Threshold/sill
    threshold = box("Threshold", (total_w + 0.04, FRAME_D + 0.02, 0.02),
                    (0, fy, 0.01), frame_wood)
    parts.append(threshold)

    # === DOORS (at Y=0) ===
    # Left door
    ldx = -DOOR_WIDTH/2  # center X of left door
    left_door = box("Door_L", (DOOR_WIDTH - 0.005, DOOR_THICK, DOOR_HEIGHT),
                    (ldx, 0, DOOR_HEIGHT/2), dark_wood)
    parts.append(left_door)

    # Right door
    rdx = DOOR_WIDTH/2
    right_door = box("Door_R", (DOOR_WIDTH - 0.005, DOOR_THICK, DOOR_HEIGHT),
                     (rdx, 0, DOOR_HEIGHT/2), dark_wood)
    parts.append(right_door)

    # === DOOR DETAILS ===
    panel_w = DOOR_WIDTH * 0.6
    panel_out = 0.012  # How far panel protrudes
    pz_front = DOOR_THICK/2 + panel_out/2

    for dx, prefix in [(ldx, "L"), (rdx, "R")]:
        # Upper raised panel
        up_h = DOOR_HEIGHT * 0.30
        up_z = DOOR_HEIGHT * 0.70
        up = box(f"Panel_{prefix}_U", (panel_w, panel_out, up_h),
                 (dx, pz_front, up_z), dark_wood)
        up.parent = left_door if prefix == "L" else right_door
        parts.append(up)

        # Lower raised panel
        lo_h = DOOR_HEIGHT * 0.20
        lo_z = DOOR_HEIGHT * 0.22
        lo = box(f"Panel_{prefix}_L", (panel_w, panel_out, lo_h),
                 (dx, pz_front, lo_z), dark_wood)
        lo.parent = left_door if prefix == "L" else right_door
        parts.append(lo)

        # Horizontal accent band
        band = box(f"Band_{prefix}", (panel_w + 0.02, 0.01, 0.04),
                   (dx, pz_front + 0.006, DOOR_HEIGHT * 0.46), gold)
        band.parent = left_door if prefix == "L" else right_door
        parts.append(band)

        # Handle (near center seam)
        hx = dx + (DOOR_WIDTH * 0.36 if dx < 0 else -DOOR_WIDTH * 0.36)
        hz = DOOR_HEIGHT * 0.46

        # Backplate
        bp = box(f"Handle_{prefix}_BP", (0.04, 0.012, 0.12),
                 (hx, pz_front + 0.01, hz), bronze)
        bp.parent = left_door if prefix == "L" else right_door
        parts.append(bp)

        # Lever
        lv = cyl(f"Handle_{prefix}_LV", 0.008, 0.08,
                 (hx, pz_front + 0.05, hz), (math.radians(90), 0, 0), bronze)
        lv.parent = left_door if prefix == "L" else right_door
        parts.append(lv)

        # Decorative studs on upper panel corners
        for sx, sz in [(-panel_w/2 + 0.03, up_z + up_h/2 - 0.03),
                       (panel_w/2 - 0.03, up_z + up_h/2 - 0.03),
                       (-panel_w/2 + 0.03, up_z - up_h/2 + 0.03),
                       (panel_w/2 - 0.03, up_z - up_h/2 + 0.03)]:
            st = cyl(f"Stud_{prefix}", 0.01, 0.01,
                     (dx + sx, pz_front + 0.01, sz), (math.radians(90), 0, 0), gold)
            st.parent = left_door if prefix == "L" else right_door

    # === CROWN MOLDING ===
    crown = box("Crown", (total_w + 0.02, 0.015, 0.035),
                (0, DOOR_THICK/2 + 0.008, DOOR_HEIGHT + FRAME_W + 0.018), gold)
    parts.append(crown)

    # Create parent for all
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    root = bpy.context.active_object
    root.name = "MansionDoor"

    for p in parts:
        if p.parent is None:
            p.parent = root

    return root

def setup_scene(target, dist):
    scene = bpy.context.scene
    t = Vector(target)

    # Lights
    for name, energy, size, offset in [
        ("Key", 500, 2, (dist*0.8, -dist*1.2, dist*0.7)),
        ("Fill", 150, 3, (-dist*0.6, -dist, dist*0.3)),
        ("Rim", 250, 1.5, (0, dist*0.2, dist*0.5))
    ]:
        light = bpy.data.lights.new(name, 'AREA')
        light.energy = energy
        light.size = size
        light.color = (1.0, 0.95, 0.9)
        obj = bpy.data.objects.new(name, light)
        obj.location = t + Vector(offset)
        scene.collection.objects.link(obj)

    # Camera (front-angled view)
    cam = bpy.data.cameras.new("Cam")
    cam_obj = bpy.data.objects.new("Cam", cam)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.location = t + Vector((dist*0.3, -dist*0.85, dist*0.08))
    direction = t - cam_obj.location
    cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

def render(filepath):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 768
    scene.render.filepath = filepath
    scene.render.image_settings.file_format = 'PNG'

    scene.world = bpy.data.worlds.new("Dark")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.01, 0.012, 0.018, 1.0)

    bpy.ops.render.render(write_still=True)
    print(f"PREVIEW: {filepath}")

def export(filepath):
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
    )
    print(f"GLB: {filepath}")

def info():
    min_c = Vector((float('inf'),) * 3)
    max_c = Vector((float('-inf'),) * 3)
    verts, faces = 0, 0
    for o in bpy.data.objects:
        if o.type == 'MESH':
            verts += len(o.data.vertices)
            faces += len(o.data.polygons)
            for v in o.data.vertices:
                w = o.matrix_world @ v.co
                min_c = Vector((min(min_c[i], w[i]) for i in range(3)))
                max_c = Vector((max(max_c[i], w[i]) for i in range(3)))
    dims = [round(max_c[i] - min_c[i], 3) for i in range(3)]
    print(f"INFO: {json.dumps({'name': ASSET_NAME, 'dims': dims, 'verts': verts, 'faces': faces})}")

def main():
    args = parse_args()
    out = args.get("output", OUTPUT_DIR)

    try:
        generate()
        setup_scene((0, 0, DOOR_HEIGHT/2), 4)
        render(f"{out}/{ASSET_NAME}_preview.png")
        export(f"{out}/{ASSET_NAME}.glb")
        info()
    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "tb": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
