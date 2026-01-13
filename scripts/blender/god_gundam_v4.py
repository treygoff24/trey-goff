#!/usr/bin/env python3
"""
God Gundam - Version 4
Simplified, carefully positioned parts - no rotations that might cause issues
Run: blender -b --python god_gundam_v4.py --python-exit-code 1 -- output=/tmp
"""
import bpy
import sys
import json
import math
from mathutils import Vector

OUTPUT_DIR = "/tmp"
ASSET_NAME = "GodGundam_v4"

# Color palette
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

def create_material(name, color, roughness=0.4, metallic=0.3, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission > 0:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission
    return mat

def setup_materials():
    mats = {}
    mats['white'] = create_material("GG_White", COLORS['white'], 0.25, 0.15)
    mats['light_gray'] = create_material("GG_LightGray", COLORS['light_gray'], 0.35, 0.25)
    mats['dark_gray'] = create_material("GG_DarkGray", COLORS['dark_gray'], 0.45, 0.35)
    mats['blue'] = create_material("GG_Blue", COLORS['blue'], 0.25, 0.25)
    mats['dark_blue'] = create_material("GG_DarkBlue", COLORS['dark_blue'], 0.35, 0.25)
    mats['red'] = create_material("GG_Red", COLORS['red'], 0.25, 0.15)
    mats['gold'] = create_material("GG_Gold", COLORS['gold'], 0.15, 0.85)
    mats['orange'] = create_material("GG_Orange", COLORS['orange'], 0.25, 0.15, 0.8)
    mats['green'] = create_material("GG_Green", COLORS['green'], 0.08, 0.05, 3.0)
    mats['black'] = create_material("GG_Black", COLORS['black'], 0.55, 0.3)
    return mats

def apply_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def make_cube(name, loc, dims, mat):
    """Create cube at location with given dimensions (full size, not half)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    # dims = (width_x, depth_y, height_z) - FULL dimensions
    obj.dimensions = dims
    bpy.ops.object.transform_apply(scale=True)
    apply_mat(obj, mat)
    return obj

def make_cylinder(name, loc, radius, height, mat, axis='Z'):
    """Create cylinder."""
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    if axis == 'X':
        obj.rotation_euler = (0, math.radians(90), 0)
    elif axis == 'Y':
        obj.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    apply_mat(obj, mat)
    return obj

def make_cone(name, loc, r_bottom, r_top, height, mat, tilt_x=0, tilt_y=0):
    """Create a cone/spike."""
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r_bottom, radius2=r_top, depth=height, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = (math.radians(tilt_x), math.radians(tilt_y), 0)
    bpy.ops.object.transform_apply(rotation=True)
    apply_mat(obj, mat)
    return obj

# ============================================================
# MODEL BUILDER
# ============================================================

def build_gundam(mats):
    """Build the God Gundam piece by piece."""
    parts = []

    # ===================
    # TORSO (center of model)
    # ===================
    torso_z = 1.4

    # Main chest (blue)
    parts.append(make_cube("Chest", (0, 0, torso_z), (0.45, 0.3, 0.35), mats['blue']))

    # Upper chest / collar (white)
    parts.append(make_cube("Collar", (0, -0.02, torso_z + 0.18), (0.4, 0.15, 0.12), mats['white']))

    # Cockpit area (red center)
    parts.append(make_cube("Cockpit", (0, -0.15, torso_z + 0.05), (0.15, 0.04, 0.18), mats['red']))

    # Chest vents (orange) - left and right
    parts.append(make_cube("VentL", (-0.13, -0.15, torso_z + 0.08), (0.09, 0.04, 0.14), mats['orange']))
    parts.append(make_cube("VentR", (0.13, -0.15, torso_z + 0.08), (0.09, 0.04, 0.14), mats['orange']))

    # Chest gem (green)
    parts.append(make_cube("ChestGem", (0, -0.16, torso_z + 0.14), (0.07, 0.02, 0.07), mats['green']))

    # Gold vent trim
    parts.append(make_cube("VentTrimL", (-0.13, -0.17, torso_z + 0.08), (0.07, 0.01, 0.1), mats['gold']))
    parts.append(make_cube("VentTrimR", (0.13, -0.17, torso_z + 0.08), (0.07, 0.01, 0.1), mats['gold']))

    # Waist
    parts.append(make_cube("Waist", (0, 0, torso_z - 0.24), (0.3, 0.22, 0.14), mats['dark_gray']))

    # Abdomen (red)
    parts.append(make_cube("Abdomen", (0, -0.08, torso_z - 0.1), (0.18, 0.06, 0.14), mats['red']))

    # Neck
    parts.append(make_cylinder("Neck", (0, 0, torso_z + 0.28), 0.06, 0.1, mats['dark_gray']))

    # ===================
    # HEAD
    # ===================
    head_z = torso_z + 0.46

    # Main helmet (white)
    parts.append(make_cube("Helmet", (0, 0, head_z), (0.3, 0.28, 0.22), mats['white']))

    # Face (blue)
    parts.append(make_cube("Face", (0, -0.12, head_z - 0.02), (0.2, 0.06, 0.14), mats['blue']))

    # Visor (green glow)
    parts.append(make_cube("Visor", (0, -0.15, head_z + 0.02), (0.18, 0.02, 0.05), mats['green']))

    # Chin (red)
    parts.append(make_cube("Chin", (0, -0.13, head_z - 0.08), (0.12, 0.04, 0.05), mats['red']))

    # V-Fin center (gold)
    parts.append(make_cone("VFinC", (0, -0.05, head_z + 0.24), 0.03, 0.005, 0.3, mats['gold'], -20, 0))

    # V-Fin left
    parts.append(make_cone("VFinL", (-0.14, -0.03, head_z + 0.2), 0.025, 0.004, 0.35, mats['gold'], -35, -45))

    # V-Fin right
    parts.append(make_cone("VFinR", (0.14, -0.03, head_z + 0.2), 0.025, 0.004, 0.35, mats['gold'], -35, 45))

    # Head crest (white fin on top)
    parts.append(make_cube("Crest", (0, 0.02, head_z + 0.12), (0.02, 0.12, 0.08), mats['white']))

    # ===================
    # SHOULDERS - MASSIVE
    # ===================
    shoulder_z = torso_z + 0.12

    for side, sx in [('L', -1), ('R', 1)]:
        x_base = sx * 0.32

        # Shoulder joint
        parts.append(make_cube(f"ShoulderJoint{side}", (x_base, 0, shoulder_z), (0.14, 0.16, 0.16), mats['dark_gray']))

        # Main shoulder armor (WHITE - HUGE)
        armor_x = x_base + sx * 0.14
        parts.append(make_cube(f"ShoulderArmor{side}", (armor_x, 0, shoulder_z + 0.1), (0.28, 0.42, 0.32), mats['white']))

        # Red trim on top
        parts.append(make_cube(f"ShoulderRed{side}", (armor_x + sx * 0.02, 0, shoulder_z + 0.26), (0.22, 0.4, 0.04), mats['red']))

        # Red front edge
        parts.append(make_cube(f"ShoulderFront{side}", (armor_x, -0.19, shoulder_z + 0.1), (0.22, 0.04, 0.24), mats['red']))

        # Black vents
        parts.append(make_cube(f"ShoulderVent{side}", (x_base, 0, shoulder_z - 0.1), (0.12, 0.2, 0.08), mats['black']))

        # Gold accent
        parts.append(make_cube(f"ShoulderGold{side}", (armor_x - sx * 0.08, -0.12, shoulder_z + 0.05), (0.04, 0.12, 0.1), mats['gold']))

    # ===================
    # ARMS
    # ===================
    arm_z = torso_z - 0.05

    for side, sx in [('L', -1), ('R', 1)]:
        x_base = sx * 0.44

        # Upper arm (blue)
        parts.append(make_cube(f"UpperArm{side}", (x_base, 0, arm_z), (0.14, 0.16, 0.28), mats['blue']))

        # Upper arm armor (white)
        parts.append(make_cube(f"UpperArmArmor{side}", (x_base + sx * 0.05, -0.04, arm_z), (0.06, 0.12, 0.22), mats['white']))

        # Elbow
        parts.append(make_cylinder(f"Elbow{side}", (x_base, 0, arm_z - 0.18), 0.07, 0.1, mats['dark_gray'], 'X'))

        # Forearm (white)
        parts.append(make_cube(f"Forearm{side}", (x_base, 0, arm_z - 0.4), (0.13, 0.15, 0.26), mats['white']))

        # Forearm armor
        parts.append(make_cube(f"ForearmArmor{side}", (x_base + sx * 0.07, -0.02, arm_z - 0.38), (0.06, 0.12, 0.2), mats['white']))

        # Gold on forearm
        parts.append(make_cube(f"ForearmGold{side}", (x_base, -0.09, arm_z - 0.34), (0.08, 0.02, 0.12), mats['gold']))

        # Hand
        parts.append(make_cube(f"Hand{side}", (x_base, -0.02, arm_z - 0.58), (0.1, 0.12, 0.12), mats['dark_gray']))

    # ===================
    # SKIRT ARMOR
    # ===================
    skirt_z = torso_z - 0.38

    # Front center
    parts.append(make_cube("SkirtFC", (0, -0.14, skirt_z), (0.14, 0.04, 0.22), mats['white']))
    parts.append(make_cube("SkirtFCBlue", (0, -0.16, skirt_z - 0.04), (0.1, 0.02, 0.12), mats['blue']))

    # Front sides
    for side, sx in [('L', -1), ('R', 1)]:
        parts.append(make_cube(f"SkirtFS{side}", (sx * 0.12, -0.12, skirt_z), (0.12, 0.04, 0.24), mats['white']))
        parts.append(make_cube(f"SkirtFSBlue{side}", (sx * 0.12, -0.14, skirt_z - 0.06), (0.08, 0.02, 0.12), mats['blue']))

    # Side skirts
    for side, sx in [('L', -1), ('R', 1)]:
        parts.append(make_cube(f"SkirtSide{side}", (sx * 0.22, 0, skirt_z - 0.02), (0.08, 0.22, 0.3), mats['white']))
        parts.append(make_cube(f"SkirtSideBlue{side}", (sx * 0.24, 0, skirt_z - 0.06), (0.04, 0.16, 0.2), mats['blue']))

    # Rear
    parts.append(make_cube("SkirtRear", (0, 0.12, skirt_z - 0.02), (0.24, 0.05, 0.26), mats['white']))

    # ===================
    # LEGS
    # ===================
    leg_top_z = skirt_z - 0.18

    for side, sx in [('L', -1), ('R', 1)]:
        x_base = sx * 0.14

        # Hip joint
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(x_base, 0, leg_top_z + 0.04))
        hip = bpy.context.active_object
        hip.name = f"Hip{side}"
        apply_mat(hip, mats['dark_gray'])
        parts.append(hip)

        # Thigh (white)
        parts.append(make_cube(f"Thigh{side}", (x_base, 0, leg_top_z - 0.18), (0.16, 0.2, 0.34), mats['white']))

        # Thigh armor
        parts.append(make_cube(f"ThighArmor{side}", (x_base + sx * 0.09, -0.04, leg_top_z - 0.16), (0.06, 0.14, 0.24), mats['light_gray']))

        # Knee (blue)
        parts.append(make_cube(f"Knee{side}", (x_base, -0.06, leg_top_z - 0.4), (0.14, 0.16, 0.16), mats['blue']))
        parts.append(make_cube(f"KneeCap{side}", (x_base, -0.13, leg_top_z - 0.4), (0.1, 0.04, 0.12), mats['dark_blue']))

        # Shin (white)
        parts.append(make_cube(f"Shin{side}", (x_base, 0, leg_top_z - 0.68), (0.15, 0.18, 0.38), mats['white']))

        # Shin armor (blue)
        parts.append(make_cube(f"ShinArmor{side}", (x_base, -0.11, leg_top_z - 0.66), (0.11, 0.04, 0.3), mats['blue']))

        # Calf armor
        parts.append(make_cube(f"Calf{side}", (x_base, 0.11, leg_top_z - 0.64), (0.12, 0.06, 0.26), mats['light_gray']))

        # Ankle
        parts.append(make_cylinder(f"Ankle{side}", (x_base, 0, leg_top_z - 0.9), 0.06, 0.08, mats['dark_gray']))

        # Ankle guard
        parts.append(make_cube(f"AnkleGuard{side}", (x_base, 0, leg_top_z - 0.92), (0.16, 0.18, 0.05), mats['white']))

        # Foot
        parts.append(make_cube(f"Foot{side}", (x_base, -0.06, leg_top_z - 1.0), (0.14, 0.26, 0.1), mats['white']))

        # Toe (red)
        parts.append(make_cube(f"Toe{side}", (x_base, -0.18, leg_top_z - 1.0), (0.12, 0.1, 0.09), mats['red']))

        # Heel
        parts.append(make_cube(f"Heel{side}", (x_base, 0.08, leg_top_z - 1.0), (0.12, 0.1, 0.09), mats['white']))

    # ===================
    # BACKPACK + WINGS
    # ===================
    back_z = torso_z

    # Backpack main
    parts.append(make_cube("Backpack", (0, 0.17, back_z), (0.32, 0.14, 0.3), mats['white']))

    # Thrusters
    parts.append(make_cylinder("ThrusterL", (-0.1, 0.24, back_z - 0.08), 0.06, 0.1, mats['dark_gray'], 'Y'))
    parts.append(make_cylinder("ThrusterR", (0.1, 0.24, back_z - 0.08), 0.06, 0.1, mats['dark_gray'], 'Y'))

    # Spine
    parts.append(make_cube("Spine", (0, 0.22, back_z + 0.08), (0.1, 0.08, 0.24), mats['dark_gray']))

    # WING BINDERS - 4 of them (massive!)
    wing_configs = [
        ('WingLU', -1, 0.15),   # Left Upper
        ('WingRU', 1, 0.15),    # Right Upper
        ('WingLL', -1, -0.1),   # Left Lower
        ('WingRL', 1, -0.1),    # Right Lower
    ]

    for name, sx, z_off in wing_configs:
        base_x = sx * 0.18
        base_y = 0.2
        base_z = back_z + z_off

        # Wing mount
        parts.append(make_cube(f"{name}Mount", (base_x + sx * 0.08, base_y + 0.1, base_z), (0.1, 0.2, 0.12), mats['dark_gray']))

        # Main wing blade (WHITE - LONG)
        blade_x = base_x + sx * 0.4
        blade_y = base_y + 0.45
        parts.append(make_cube(f"{name}Blade", (blade_x, blade_y, base_z), (0.08, 0.9, 0.22), mats['white']))

        # Red section
        parts.append(make_cube(f"{name}Red", (blade_x + sx * 0.03, blade_y - 0.15, base_z), (0.06, 0.4, 0.12), mats['red']))

        # Wing tip
        parts.append(make_cube(f"{name}Tip", (blade_x - sx * 0.01, blade_y + 0.38, base_z), (0.05, 0.15, 0.1), mats['light_gray']))

    return parts

def setup_scene():
    scene = bpy.context.scene

    # World
    scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.03, 0.03, 0.05, 1.0)
    bg.inputs["Strength"].default_value = 0.3

    # Lights
    key_data = bpy.data.lights.new("Key", type='AREA')
    key_data.energy = 1500
    key_data.size = 5
    key_data.color = (1.0, 0.95, 0.9)
    key = bpy.data.objects.new("Key", key_data)
    key.location = (5, -6, 7)
    key.rotation_euler = (math.radians(55), 0, math.radians(40))
    scene.collection.objects.link(key)

    fill_data = bpy.data.lights.new("Fill", type='AREA')
    fill_data.energy = 500
    fill_data.size = 6
    fill_data.color = (0.85, 0.9, 1.0)
    fill = bpy.data.objects.new("Fill", fill_data)
    fill.location = (-5, -4, 5)
    scene.collection.objects.link(fill)

    rim_data = bpy.data.lights.new("Rim", type='AREA')
    rim_data.energy = 700
    rim_data.size = 3
    rim = bpy.data.objects.new("Rim", rim_data)
    rim.location = (0, 6, 6)
    scene.collection.objects.link(rim)

    # Camera
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 85
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Position: front-right angle, looking at torso height
    cam.location = (4.5, -6.5, 1.6)
    target = Vector((0, 0, 1.2))
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

def render(filepath):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100
    scene.render.filepath = filepath
    scene.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED: {filepath}")

def export_glb(filepath):
    bpy.ops.export_scene.gltf(filepath=filepath, export_format='GLB', use_selection=False, export_apply=True, export_yup=True)
    print(f"EXPORTED: {filepath}")

def main():
    argv = sys.argv
    output_dir = OUTPUT_DIR
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
        for arg in args:
            if arg.startswith("output="):
                output_dir = arg.split("=")[1]

    try:
        cleanup()
        mats = setup_materials()
        parts = build_gundam(mats)

        # Parent all to empty
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
