#!/usr/bin/env python3
"""
God Gundam - Version 6
Fixed wing positioning - wings extend outward from mount points
Run: blender -b --python god_gundam_v6.py --python-exit-code 1 -- output=/tmp
"""
import bpy
import sys
import json
import math
from mathutils import Vector

OUTPUT_DIR = "/tmp"
ASSET_NAME = "GodGundam_v6"

COLORS = {
    'white': (0.92, 0.92, 0.94),
    'light_gray': (0.75, 0.75, 0.77),
    'dark_gray': (0.2, 0.2, 0.22),
    'blue': (0.08, 0.12, 0.55),
    'dark_blue': (0.04, 0.06, 0.35),
    'red': (0.85, 0.08, 0.08),
    'gold': (0.9, 0.7, 0.15),
    'orange': (0.95, 0.55, 0.1),
    'green': (0.1, 0.85, 0.35),
    'black': (0.015, 0.015, 0.015),
}

def cleanup():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, color, rough=0.4, metal=0.3, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit > 0:
        b.inputs["Emission Color"].default_value = (*color, 1.0)
        b.inputs["Emission Strength"].default_value = emit
    return m

def setup_mats():
    return {
        'white': mat("White", COLORS['white'], 0.25, 0.15),
        'light_gray': mat("LightGray", COLORS['light_gray'], 0.35, 0.25),
        'dark_gray': mat("DarkGray", COLORS['dark_gray'], 0.45, 0.35),
        'blue': mat("Blue", COLORS['blue'], 0.25, 0.25),
        'dark_blue': mat("DarkBlue", COLORS['dark_blue'], 0.35, 0.25),
        'red': mat("Red", COLORS['red'], 0.25, 0.15),
        'gold': mat("Gold", COLORS['gold'], 0.15, 0.85),
        'orange': mat("Orange", COLORS['orange'], 0.25, 0.15, 0.8),
        'green': mat("Green", COLORS['green'], 0.08, 0.05, 3.0),
        'black': mat("Black", COLORS['black'], 0.55, 0.3),
    }

def apply_mat(obj, m):
    if obj.data.materials:
        obj.data.materials[0] = m
    else:
        obj.data.materials.append(m)

def box(name, loc, dims, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(scale=True)
    apply_mat(o, m)
    return o

def cyl(name, loc, r, h, m, axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc)
    o = bpy.context.active_object
    o.name = name
    if axis == 'X':
        o.rotation_euler = (0, math.radians(90), 0)
    elif axis == 'Y':
        o.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    apply_mat(o, m)
    return o

def spike(name, loc, r1, r2, h, m, tilt_x=0, tilt_y=0, verts=8):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = (math.radians(tilt_x), math.radians(tilt_y), 0)
    bpy.ops.object.transform_apply(rotation=True)
    apply_mat(o, m)
    return o

def build(mats):
    parts = []

    torso_z = 1.4
    head_z = torso_z + 0.48
    shoulder_z = torso_z + 0.12
    arm_z = torso_z - 0.05
    skirt_z = torso_z - 0.38
    leg_z = skirt_z - 0.18
    back_z = torso_z

    # =================== TORSO ===================
    parts.append(box("Chest", (0, 0, torso_z), (0.48, 0.32, 0.38), mats['blue']))
    parts.append(box("Collar", (0, -0.02, torso_z + 0.2), (0.42, 0.16, 0.14), mats['white']))
    parts.append(box("Cockpit", (0, -0.16, torso_z + 0.06), (0.16, 0.05, 0.2), mats['red']))

    for s, x in [('L', -0.14), ('R', 0.14)]:
        parts.append(box(f"Vent{s}", (x, -0.16, torso_z + 0.1), (0.1, 0.05, 0.16), mats['orange']))
        parts.append(box(f"VentTrim{s}", (x, -0.18, torso_z + 0.1), (0.08, 0.015, 0.12), mats['gold']))

    parts.append(box("ChestGem", (0, -0.17, torso_z + 0.16), (0.08, 0.025, 0.08), mats['green']))
    parts.append(box("Waist", (0, 0, torso_z - 0.26), (0.32, 0.24, 0.16), mats['dark_gray']))
    parts.append(box("Abdomen", (0, -0.09, torso_z - 0.12), (0.2, 0.07, 0.16), mats['red']))
    parts.append(cyl("Neck", (0, 0, torso_z + 0.3), 0.07, 0.12, mats['dark_gray']))

    # =================== HEAD ===================
    parts.append(box("Helmet", (0, 0, head_z), (0.32, 0.3, 0.24), mats['white']))
    parts.append(box("Face", (0, -0.13, head_z - 0.02), (0.22, 0.07, 0.16), mats['blue']))
    parts.append(box("Visor", (0, -0.16, head_z + 0.02), (0.2, 0.025, 0.06), mats['green']))
    parts.append(box("Chin", (0, -0.14, head_z - 0.09), (0.14, 0.045, 0.06), mats['red']))
    parts.append(spike("VFinC", (0, -0.06, head_z + 0.28), 0.035, 0.006, 0.35, mats['gold'], -22, 0))
    parts.append(spike("VFinL", (-0.16, -0.04, head_z + 0.24), 0.028, 0.005, 0.4, mats['gold'], -38, -48))
    parts.append(spike("VFinR", (0.16, -0.04, head_z + 0.24), 0.028, 0.005, 0.4, mats['gold'], -38, 48))
    parts.append(box("Crest", (0, 0.03, head_z + 0.14), (0.025, 0.14, 0.1), mats['white']))

    # =================== SHOULDERS ===================
    for s, sx in [('L', -1), ('R', 1)]:
        x = sx * 0.34
        parts.append(box(f"ShJoint{s}", (x, 0, shoulder_z), (0.16, 0.18, 0.18), mats['dark_gray']))
        ax = x + sx * 0.16
        parts.append(box(f"ShArmor{s}", (ax, 0, shoulder_z + 0.12), (0.32, 0.46, 0.36), mats['white']))
        parts.append(box(f"ShRedTop{s}", (ax + sx * 0.02, 0, shoulder_z + 0.3), (0.26, 0.44, 0.05), mats['red']))
        parts.append(box(f"ShRedFront{s}", (ax, -0.21, shoulder_z + 0.12), (0.26, 0.05, 0.28), mats['red']))
        parts.append(box(f"ShVents{s}", (x, 0, shoulder_z - 0.12), (0.14, 0.24, 0.1), mats['black']))
        parts.append(box(f"ShGold{s}", (ax - sx * 0.1, -0.14, shoulder_z + 0.06), (0.05, 0.14, 0.12), mats['gold']))

    # =================== ARMS ===================
    for s, sx in [('L', -1), ('R', 1)]:
        x = sx * 0.48
        parts.append(box(f"UpArm{s}", (x, 0, arm_z), (0.16, 0.18, 0.3), mats['blue']))
        parts.append(box(f"UpArmArmor{s}", (x + sx * 0.06, -0.05, arm_z), (0.07, 0.14, 0.24), mats['white']))
        parts.append(cyl(f"Elbow{s}", (x, 0, arm_z - 0.2), 0.08, 0.12, mats['dark_gray'], 'X'))
        parts.append(box(f"Forearm{s}", (x, 0, arm_z - 0.44), (0.15, 0.17, 0.3), mats['white']))
        parts.append(box(f"ForeArmor{s}", (x + sx * 0.08, -0.02, arm_z - 0.42), (0.07, 0.14, 0.24), mats['white']))
        parts.append(box(f"ForeGold{s}", (x, -0.1, arm_z - 0.38), (0.1, 0.025, 0.14), mats['gold']))
        parts.append(box(f"Hand{s}", (x, -0.02, arm_z - 0.64), (0.12, 0.14, 0.14), mats['dark_gray']))

    # =================== SKIRT ===================
    parts.append(box("SkFC", (0, -0.15, skirt_z), (0.16, 0.05, 0.24), mats['white']))
    parts.append(box("SkFCBlue", (0, -0.17, skirt_z - 0.05), (0.12, 0.025, 0.14), mats['blue']))

    for s, sx in [('L', -1), ('R', 1)]:
        parts.append(box(f"SkFS{s}", (sx * 0.13, -0.13, skirt_z), (0.14, 0.05, 0.26), mats['white']))
        parts.append(box(f"SkFSBlue{s}", (sx * 0.13, -0.15, skirt_z - 0.06), (0.1, 0.025, 0.14), mats['blue']))
        parts.append(box(f"SkSide{s}", (sx * 0.24, 0, skirt_z - 0.02), (0.1, 0.24, 0.34), mats['white']))
        parts.append(box(f"SkSideBlue{s}", (sx * 0.26, 0, skirt_z - 0.06), (0.05, 0.18, 0.22), mats['blue']))

    parts.append(box("SkRear", (0, 0.13, skirt_z - 0.02), (0.28, 0.06, 0.3), mats['white']))

    # =================== LEGS ===================
    for s, sx in [('L', -1), ('R', 1)]:
        x = sx * 0.15

        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(x, 0, leg_z + 0.05))
        hip = bpy.context.active_object
        hip.name = f"Hip{s}"
        apply_mat(hip, mats['dark_gray'])
        parts.append(hip)

        parts.append(box(f"Thigh{s}", (x, 0, leg_z - 0.2), (0.18, 0.22, 0.38), mats['white']))
        parts.append(box(f"ThArmor{s}", (x + sx * 0.1, -0.05, leg_z - 0.18), (0.07, 0.16, 0.28), mats['light_gray']))
        parts.append(box(f"Knee{s}", (x, -0.07, leg_z - 0.44), (0.16, 0.18, 0.18), mats['blue']))
        parts.append(box(f"KneeCap{s}", (x, -0.14, leg_z - 0.44), (0.12, 0.05, 0.14), mats['dark_blue']))
        parts.append(box(f"Shin{s}", (x, 0, leg_z - 0.74), (0.17, 0.2, 0.42), mats['white']))
        parts.append(box(f"ShinArmor{s}", (x, -0.12, leg_z - 0.72), (0.13, 0.05, 0.34), mats['blue']))
        parts.append(box(f"Calf{s}", (x, 0.12, leg_z - 0.7), (0.14, 0.08, 0.3), mats['light_gray']))
        parts.append(cyl(f"Ankle{s}", (x, 0, leg_z - 0.98), 0.07, 0.1, mats['dark_gray']))
        parts.append(box(f"AnkleGuard{s}", (x, 0, leg_z - 1.0), (0.18, 0.2, 0.06), mats['white']))
        parts.append(box(f"Foot{s}", (x, -0.07, leg_z - 1.08), (0.16, 0.3, 0.12), mats['white']))
        parts.append(box(f"Toe{s}", (x, -0.2, leg_z - 1.08), (0.14, 0.12, 0.1), mats['red']))
        parts.append(box(f"Heel{s}", (x, 0.1, leg_z - 1.08), (0.14, 0.12, 0.1), mats['white']))

    # =================== BACKPACK ===================
    parts.append(box("Backpack", (0, 0.18, back_z), (0.36, 0.16, 0.34), mats['white']))
    parts.append(cyl("ThrL", (-0.12, 0.26, back_z - 0.1), 0.07, 0.12, mats['dark_gray'], 'Y'))
    parts.append(cyl("ThrR", (0.12, 0.26, back_z - 0.1), 0.07, 0.12, mats['dark_gray'], 'Y'))
    parts.append(box("Spine", (0, 0.24, back_z + 0.1), (0.12, 0.1, 0.28), mats['dark_gray']))

    # =================== WING BINDERS ===================
    # Using position-based spread instead of rotation
    # Wings spread outward from backpack, 4 total (2 upper, 2 lower)

    wing_configs = [
        # name, side_mult, z_offset, spread_x, spread_y, spread_z
        ('WLU', -1, 0.16, 0.7, 0.7, 0.3),    # Left Upper
        ('WRU', 1, 0.16, 0.7, 0.7, 0.3),     # Right Upper
        ('WLL', -1, -0.1, 0.6, 0.6, -0.15),  # Left Lower
        ('WRL', 1, -0.1, 0.6, 0.6, -0.15),   # Right Lower
    ]

    for name, sx, z_off, spread_x, spread_y, spread_z in wing_configs:
        # Wing mount point on backpack
        mount_x = sx * 0.18
        mount_y = 0.24
        mount_z = back_z + z_off

        # Mount connector
        parts.append(box(f"{name}Mount", (mount_x + sx * 0.06, mount_y + 0.06, mount_z), (0.1, 0.14, 0.1), mats['dark_gray']))

        # Wing blade - positioned at an angle by spreading outward
        blade_x = mount_x + sx * spread_x
        blade_y = mount_y + spread_y
        blade_z = mount_z + spread_z

        # Main blade (white) - long and thin
        parts.append(box(f"{name}Blade", (blade_x, blade_y, blade_z), (0.08, 0.9, 0.2), mats['white']))

        # Red section - inner part of blade
        parts.append(box(f"{name}Red", (blade_x + sx * 0.02, blade_y - 0.15, blade_z), (0.06, 0.35, 0.12), mats['red']))

        # Tip detail
        parts.append(box(f"{name}Tip", (blade_x, blade_y + 0.38, blade_z), (0.05, 0.15, 0.1), mats['light_gray']))

        # Connection arm from mount to blade
        arm_x = (mount_x + sx * 0.06 + blade_x) / 2
        arm_y = (mount_y + 0.06 + blade_y) / 2
        arm_z = (mount_z + blade_z) / 2
        parts.append(box(f"{name}Arm", (arm_x, arm_y, arm_z), (0.04, 0.4, 0.06), mats['light_gray']))

    return parts

def setup_scene():
    scene = bpy.context.scene

    scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.025, 0.025, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.25

    key = bpy.data.lights.new("Key", type='AREA')
    key.energy = 1800
    key.size = 6
    key.color = (1.0, 0.95, 0.9)
    key_obj = bpy.data.objects.new("Key", key)
    key_obj.location = (6, -7, 8)
    key_obj.rotation_euler = (math.radians(55), 0, math.radians(40))
    scene.collection.objects.link(key_obj)

    fill = bpy.data.lights.new("Fill", type='AREA')
    fill.energy = 600
    fill.size = 8
    fill.color = (0.85, 0.9, 1.0)
    fill_obj = bpy.data.objects.new("Fill", fill)
    fill_obj.location = (-6, -5, 6)
    scene.collection.objects.link(fill_obj)

    rim = bpy.data.lights.new("Rim", type='AREA')
    rim.energy = 900
    rim.size = 4
    rim_obj = bpy.data.objects.new("Rim", rim)
    rim_obj.location = (0, 7, 7)
    scene.collection.objects.link(rim_obj)

    cam = bpy.data.cameras.new("Cam")
    cam.lens = 80
    cam_obj = bpy.data.objects.new("Cam", cam)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.location = (4.2, -7, 1.3)
    target = Vector((0, 0, 1.3))
    direction = target - cam_obj.location
    cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

def render(fp):
    s = bpy.context.scene
    s.render.engine = 'BLENDER_EEVEE'
    s.render.resolution_x = 1200
    s.render.resolution_y = 1600
    s.render.resolution_percentage = 100
    s.render.filepath = fp
    s.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED: {fp}")

def export_glb(fp):
    bpy.ops.export_scene.gltf(filepath=fp, export_format='GLB', use_selection=False, export_apply=True, export_yup=True)
    print(f"EXPORTED: {fp}")

def main():
    argv = sys.argv
    output_dir = OUTPUT_DIR
    if "--" in argv:
        for arg in argv[argv.index("--") + 1:]:
            if arg.startswith("output="):
                output_dir = arg.split("=")[1]

    try:
        cleanup()
        mats = setup_mats()
        parts = build(mats)

        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
        parent = bpy.context.active_object
        parent.name = ASSET_NAME
        for p in parts:
            p.parent = parent

        setup_scene()
        render(f"{output_dir}/{ASSET_NAME}_preview.png")
        export_glb(f"{output_dir}/{ASSET_NAME}.glb")

        print(json.dumps({"status": "success", "parts": len(parts)}))

    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
