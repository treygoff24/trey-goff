#!/usr/bin/env python3
"""
God Gundam (Burning Gundam) 3D Model Generator - Version 3
Fixed geometry without problematic modifiers
Run: blender -b --python god_gundam_v3.py --python-exit-code 1 -- output=/tmp
"""
import bpy
import sys
import json
import math
from mathutils import Vector

OUTPUT_DIR = "/tmp"
ASSET_NAME = "GodGundam_v3"

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

def parse_args():
    argv = sys.argv
    if "--" in argv:
        script_args = argv[argv.index("--") + 1:]
    else:
        script_args = []
    args = {}
    for arg in script_args:
        if "=" in arg:
            key, val = arg.split("=", 1)
            args[key.lstrip("-")] = val
    return args

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
    mats['white'] = create_material("GG_White", COLORS['white'], roughness=0.25, metallic=0.15)
    mats['light_gray'] = create_material("GG_LightGray", COLORS['light_gray'], roughness=0.35, metallic=0.25)
    mats['dark_gray'] = create_material("GG_DarkGray", COLORS['dark_gray'], roughness=0.45, metallic=0.35)
    mats['blue'] = create_material("GG_Blue", COLORS['blue'], roughness=0.25, metallic=0.25)
    mats['dark_blue'] = create_material("GG_DarkBlue", COLORS['dark_blue'], roughness=0.35, metallic=0.25)
    mats['red'] = create_material("GG_Red", COLORS['red'], roughness=0.25, metallic=0.15)
    mats['gold'] = create_material("GG_Gold", COLORS['gold'], roughness=0.15, metallic=0.85)
    mats['orange'] = create_material("GG_Orange", COLORS['orange'], roughness=0.25, metallic=0.15, emission=0.8)
    mats['green'] = create_material("GG_Green", COLORS['green'], roughness=0.08, metallic=0.05, emission=3.0)
    mats['black'] = create_material("GG_Black", COLORS['black'], roughness=0.55, metallic=0.3)
    return mats

def apply_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def cube(loc, scale, name, mat):
    """Create a simple cube with no modifiers."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (scale[0]/2, scale[1]/2, scale[2]/2)
    bpy.ops.object.transform_apply(scale=True)
    apply_mat(obj, mat)
    return obj

def cube_rot(loc, scale, rotation, name, mat):
    """Create cube with rotation applied."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (scale[0]/2, scale[1]/2, scale[2]/2)
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    apply_mat(obj, mat)
    return obj

def cylinder(loc, radius, depth, name, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(rotation=True)
    apply_mat(obj, mat)
    return obj

def cone(loc, r1, r2, depth, name, mat, rotation=(0, 0, 0), verts=4):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(rotation=True)
    apply_mat(obj, mat)
    return obj

# ============================================================
# HEAD
# ============================================================
def create_head(mats, z):
    parts = []

    # Main helmet
    parts.append(cube((0, 0, z), (0.28, 0.26, 0.2), "Head_Helmet", mats['white']))

    # Face plate (blue)
    parts.append(cube((0, -0.11, z - 0.02), (0.18, 0.06, 0.12), "Head_Face", mats['blue']))

    # Visor (green, glowing)
    parts.append(cube((0, -0.14, z + 0.01), (0.16, 0.02, 0.04), "Head_Visor", mats['green']))

    # Chin guard (red)
    parts.append(cube((0, -0.12, z - 0.08), (0.1, 0.04, 0.04), "Head_Chin", mats['red']))

    # V-Fin center (gold) - BIG
    parts.append(cone((0, -0.04, z + 0.2), 0.025, 0.005, 0.25,
                      "Head_VFin_Center", mats['gold'], (math.radians(-20), 0, 0)))

    # V-Fin left
    parts.append(cone((-0.12, -0.02, z + 0.18), 0.02, 0.004, 0.3,
                      "Head_VFin_L", mats['gold'], (math.radians(-35), math.radians(-40), 0)))

    # V-Fin right
    parts.append(cone((0.12, -0.02, z + 0.18), 0.02, 0.004, 0.3,
                      "Head_VFin_R", mats['gold'], (math.radians(-35), math.radians(40), 0)))

    # Forehead crest
    parts.append(cube((0, 0.02, z + 0.12), (0.02, 0.1, 0.06), "Head_Crest", mats['white']))

    # Side vents
    for side, x in [('L', -0.12), ('R', 0.12)]:
        parts.append(cube((x, 0, z), (0.05, 0.15, 0.1), f"Head_SideVent_{side}", mats['light_gray']))

    return parts

# ============================================================
# TORSO
# ============================================================
def create_torso(mats, z):
    parts = []

    # Main chest core (blue)
    parts.append(cube((0, 0, z), (0.4, 0.28, 0.32), "Torso_Chest", mats['blue']))

    # Upper chest plate (white collar)
    parts.append(cube((0, -0.02, z + 0.18), (0.35, 0.14, 0.1), "Torso_Collar", mats['white']))

    # Center cockpit (red)
    parts.append(cube((0, -0.14, z + 0.04), (0.14, 0.04, 0.16), "Torso_Cockpit", mats['red']))

    # Chest vents (orange/gold)
    for side, x in [('L', -0.12), ('R', 0.12)]:
        parts.append(cube((x, -0.14, z + 0.08), (0.08, 0.04, 0.12), f"Torso_Vent_{side}", mats['orange']))
        for i, vz in enumerate([-0.02, 0.02, 0.06]):
            parts.append(cube((x, -0.16, z + vz), (0.06, 0.01, 0.02), f"Torso_VentSlat_{side}_{i}", mats['gold']))

    # Chest gem (green center)
    parts.append(cube((0, -0.15, z + 0.12), (0.06, 0.02, 0.06), "Torso_ChestGem", mats['green']))

    # Neck area
    parts.append(cylinder((0, 0, z + 0.24), 0.06, 0.08, "Torso_Neck", mats['dark_gray']))

    # Waist core
    parts.append(cube((0, 0, z - 0.22), (0.28, 0.2, 0.12), "Torso_Waist", mats['dark_gray']))

    # Abdominal armor (red)
    parts.append(cube((0, -0.08, z - 0.08), (0.16, 0.06, 0.12), "Torso_Abdomen", mats['red']))

    return parts

# ============================================================
# SHOULDERS - MASSIVE
# ============================================================
def create_shoulder(mats, side, z):
    parts = []
    x_mult = 1 if side == 'right' else -1
    x = x_mult * 0.32

    # Inner shoulder joint
    parts.append(cube((x, 0, z), (0.12, 0.14, 0.14), f"Shoulder_{side}_Joint", mats['dark_gray']))

    # Main shoulder armor block (white) - HUGE
    armor_x = x + x_mult * 0.12
    parts.append(cube((armor_x, 0, z + 0.08), (0.22, 0.36, 0.28), f"Shoulder_{side}_MainArmor", mats['white']))

    # Upper shoulder plate - angled outward
    upper_x = x + x_mult * 0.18
    parts.append(cube_rot((upper_x, 0, z + 0.2), (0.28, 0.4, 0.22),
                          (0, x_mult * math.radians(-20), 0), f"Shoulder_{side}_Upper", mats['white']))

    # Red trim on top
    parts.append(cube_rot((upper_x + x_mult * 0.04, 0, z + 0.32), (0.2, 0.38, 0.04),
                          (0, x_mult * math.radians(-20), 0), f"Shoulder_{side}_RedTop", mats['red']))

    # Red front edge
    parts.append(cube((armor_x, -0.16, z + 0.08), (0.18, 0.04, 0.2), f"Shoulder_{side}_RedFront", mats['red']))

    # Black vents underneath
    for i, vy in enumerate([-0.08, 0, 0.08]):
        parts.append(cube((x, vy, z - 0.08), (0.1, 0.06, 0.06), f"Shoulder_{side}_Vent_{i}", mats['black']))

    # Gold accent
    parts.append(cube((armor_x - x_mult * 0.06, -0.1, z + 0.04), (0.04, 0.1, 0.08), f"Shoulder_{side}_Gold", mats['gold']))

    return parts

# ============================================================
# ARMS
# ============================================================
def create_arm(mats, side, z):
    parts = []
    x_mult = 1 if side == 'right' else -1
    x = x_mult * 0.4

    # Upper arm (blue)
    parts.append(cube((x, 0, z), (0.12, 0.14, 0.24), f"Arm_{side}_Upper", mats['blue']))

    # Upper arm armor (white panel)
    parts.append(cube((x + x_mult * 0.04, -0.04, z), (0.06, 0.1, 0.18), f"Arm_{side}_UpperArmor", mats['white']))

    # Elbow joint
    parts.append(cylinder((x, 0, z - 0.16), 0.06, 0.08, f"Arm_{side}_Elbow", mats['dark_gray'], (0, math.radians(90), 0)))

    # Forearm (white)
    parts.append(cube((x, 0, z - 0.36), (0.11, 0.13, 0.22), f"Arm_{side}_Forearm", mats['white']))

    # Forearm armor plate
    parts.append(cube((x + x_mult * 0.06, -0.02, z - 0.34), (0.05, 0.1, 0.18), f"Arm_{side}_ForearmArmor", mats['white']))

    # Gold accent on arm
    parts.append(cube((x, -0.08, z - 0.3), (0.06, 0.02, 0.1), f"Arm_{side}_Gold", mats['gold']))

    # Hand (dark gray, fist)
    parts.append(cube((x, -0.02, z - 0.52), (0.08, 0.1, 0.1), f"Arm_{side}_Hand", mats['dark_gray']))

    # Fingers
    for i, fx in enumerate([-0.025, 0, 0.025]):
        parts.append(cube((x + fx, -0.07, z - 0.55), (0.018, 0.04, 0.06), f"Arm_{side}_Finger_{i}", mats['dark_gray']))

    # Thumb
    parts.append(cube((x + x_mult * 0.04, -0.04, z - 0.54), (0.02, 0.035, 0.05), f"Arm_{side}_Thumb", mats['dark_gray']))

    return parts

# ============================================================
# SKIRT ARMOR
# ============================================================
def create_skirt(mats, z):
    parts = []

    # Front center panel (white with blue)
    parts.append(cube_rot((0, -0.16, z), (0.12, 0.03, 0.2),
                          (math.radians(20), 0, 0), "Skirt_FrontCenter", mats['white']))
    parts.append(cube_rot((0, -0.18, z - 0.04), (0.08, 0.02, 0.1),
                          (math.radians(20), 0, 0), "Skirt_FrontCenterBlue", mats['blue']))

    # Front side panels
    for side, x_mult in [('L', -1), ('R', 1)]:
        parts.append(cube_rot((x_mult * 0.12, -0.14, z), (0.1, 0.03, 0.22),
                              (math.radians(25), x_mult * math.radians(-15), 0), f"Skirt_FrontSide_{side}", mats['white']))
        parts.append(cube_rot((x_mult * 0.12, -0.16, z - 0.06), (0.07, 0.02, 0.1),
                              (math.radians(25), x_mult * math.radians(-15), 0), f"Skirt_FrontSideBlue_{side}", mats['blue']))

    # Side skirt armor (large panels)
    for side, x_mult in [('L', -1), ('R', 1)]:
        parts.append(cube((x_mult * 0.22, 0, z - 0.04), (0.06, 0.2, 0.28), f"Skirt_Side_{side}", mats['white']))
        parts.append(cube((x_mult * 0.24, 0, z - 0.08), (0.03, 0.14, 0.18), f"Skirt_SideBlue_{side}", mats['blue']))

    # Rear skirt
    parts.append(cube((0, 0.14, z - 0.04), (0.22, 0.04, 0.24), "Skirt_Rear", mats['white']))

    return parts

# ============================================================
# LEGS
# ============================================================
def create_leg(mats, side, z):
    parts = []
    x_mult = 1 if side == 'right' else -1
    x = x_mult * 0.14

    # Hip ball joint
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(x, 0, z + 0.1))
    hip = bpy.context.active_object
    hip.name = f"Leg_{side}_Hip"
    apply_mat(hip, mats['dark_gray'])
    parts.append(hip)

    # Upper leg / thigh (white)
    parts.append(cube((x, 0, z - 0.12), (0.14, 0.18, 0.3), f"Leg_{side}_Thigh", mats['white']))

    # Thigh armor panel (outer)
    parts.append(cube((x + x_mult * 0.08, -0.04, z - 0.1), (0.05, 0.12, 0.2), f"Leg_{side}_ThighArmor", mats['light_gray']))

    # Knee armor (blue)
    parts.append(cube((x, -0.06, z - 0.32), (0.12, 0.14, 0.14), f"Leg_{side}_Knee", mats['blue']))

    # Knee cap detail
    parts.append(cube((x, -0.12, z - 0.32), (0.08, 0.04, 0.1), f"Leg_{side}_KneeCap", mats['dark_blue']))

    # Lower leg / shin (white)
    parts.append(cube((x, 0, z - 0.56), (0.13, 0.16, 0.32), f"Leg_{side}_Shin", mats['white']))

    # Shin armor (front blue panel)
    parts.append(cube((x, -0.1, z - 0.54), (0.09, 0.04, 0.26), f"Leg_{side}_ShinArmor", mats['blue']))

    # Calf armor (back)
    parts.append(cube((x, 0.1, z - 0.52), (0.1, 0.06, 0.22), f"Leg_{side}_Calf", mats['light_gray']))

    # Ankle
    parts.append(cylinder((x, 0, z - 0.74), 0.05, 0.06, f"Leg_{side}_Ankle", mats['dark_gray']))

    # Ankle guard band
    parts.append(cube((x, 0, z - 0.76), (0.14, 0.16, 0.04), f"Leg_{side}_AnkleGuard", mats['white']))

    # Foot base (white)
    parts.append(cube((x, -0.06, z - 0.84), (0.12, 0.22, 0.08), f"Leg_{side}_Foot", mats['white']))

    # Toe (red)
    parts.append(cube((x, -0.16, z - 0.84), (0.1, 0.08, 0.07), f"Leg_{side}_Toe", mats['red']))

    # Heel
    parts.append(cube((x, 0.06, z - 0.84), (0.1, 0.08, 0.07), f"Leg_{side}_Heel", mats['white']))

    # Foot top armor
    parts.append(cube((x, -0.04, z - 0.78), (0.1, 0.12, 0.04), f"Leg_{side}_FootTop", mats['white']))

    return parts

# ============================================================
# BACKPACK
# ============================================================
def create_backpack(mats, z):
    parts = []

    # Main backpack body
    parts.append(cube((0, 0.16, z), (0.28, 0.12, 0.26), "Backpack_Main", mats['white']))

    # Thruster housings
    for side, x_mult in [('L', -1), ('R', 1)]:
        parts.append(cylinder((x_mult * 0.1, 0.22, z - 0.06), 0.05, 0.08, f"Backpack_Thruster_{side}",
                              mats['dark_gray'], (math.radians(90), 0, 0)))
        parts.append(cube((x_mult * 0.12, 0.14, z + 0.1), (0.06, 0.08, 0.14), f"Backpack_WingMount_{side}", mats['light_gray']))

    # Central spine
    parts.append(cube((0, 0.2, z + 0.06), (0.08, 0.06, 0.2), "Backpack_Spine", mats['dark_gray']))

    return parts

# ============================================================
# WING BINDERS - HUGE
# ============================================================
def create_wing(mats, side, position, z):
    parts = []
    x_mult = 1 if side == 'right' else -1
    is_upper = position == 'upper'

    x_base = x_mult * 0.16
    y_base = 0.18
    z_offset = 0.12 if is_upper else -0.08

    # Wing angles
    y_angle = x_mult * math.radians(30 if is_upper else 20)
    x_angle = math.radians(-25 if is_upper else 15)

    # Wing mount/arm
    parts.append(cube_rot((x_base + x_mult * 0.08, y_base + 0.12, z + z_offset), (0.08, 0.2, 0.1),
                          (x_angle * 0.5, y_angle * 0.5, 0), f"Wing_{side}_{position}_Mount", mats['dark_gray']))

    # Main wing blade (WHITE) - MASSIVE
    blade_len = 0.8
    blade_width = 0.2
    blade_x = x_base + x_mult * 0.35
    blade_y = y_base + 0.4
    blade_z = z + z_offset + (0.15 if is_upper else -0.05)

    parts.append(cube_rot((blade_x, blade_y, blade_z), (0.06, blade_len, blade_width),
                          (x_angle, y_angle, 0), f"Wing_{side}_{position}_Blade", mats['white']))

    # Red section on wing (inner edge)
    red_x = blade_x + x_mult * 0.025
    red_y = blade_y - 0.1
    parts.append(cube_rot((red_x, red_y, blade_z), (0.05, blade_len * 0.4, blade_width * 0.45),
                          (x_angle, y_angle, 0), f"Wing_{side}_{position}_Red", mats['red']))

    # Wing tip detail
    tip_y = blade_y + blade_len * 0.35
    parts.append(cube_rot((blade_x - x_mult * 0.01, tip_y, blade_z), (0.04, 0.12, blade_width * 0.4),
                          (x_angle, y_angle, 0), f"Wing_{side}_{position}_Tip", mats['light_gray']))

    return parts

# ============================================================
# MAIN ASSEMBLY
# ============================================================
def generate():
    cleanup()
    mats = setup_materials()

    # Vertical positions
    leg_z = 0.88
    skirt_z = 1.1
    torso_z = 1.45
    shoulder_z = 1.6
    arm_z = 1.4
    head_z = 1.85
    backpack_z = 1.45

    all_parts = []

    print("Creating head...")
    all_parts.extend(create_head(mats, head_z))

    print("Creating torso...")
    all_parts.extend(create_torso(mats, torso_z))

    print("Creating shoulders...")
    all_parts.extend(create_shoulder(mats, 'left', shoulder_z))
    all_parts.extend(create_shoulder(mats, 'right', shoulder_z))

    print("Creating arms...")
    all_parts.extend(create_arm(mats, 'left', arm_z))
    all_parts.extend(create_arm(mats, 'right', arm_z))

    print("Creating skirt...")
    all_parts.extend(create_skirt(mats, skirt_z))

    print("Creating legs...")
    all_parts.extend(create_leg(mats, 'left', leg_z))
    all_parts.extend(create_leg(mats, 'right', leg_z))

    print("Creating backpack...")
    all_parts.extend(create_backpack(mats, backpack_z))

    print("Creating wing binders...")
    all_parts.extend(create_wing(mats, 'left', 'upper', backpack_z))
    all_parts.extend(create_wing(mats, 'right', 'upper', backpack_z))
    all_parts.extend(create_wing(mats, 'left', 'lower', backpack_z))
    all_parts.extend(create_wing(mats, 'right', 'lower', backpack_z))

    # Parent all
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    parent = bpy.context.active_object
    parent.name = ASSET_NAME
    for p in all_parts:
        p.parent = parent

    return parent, all_parts

def setup_scene(target, size):
    scene = bpy.context.scene

    # World background
    scene.world = bpy.data.worlds.new("GundamWorld")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.04, 0.04, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.3

    # Key light
    key_data = bpy.data.lights.new("KeyLight", type='AREA')
    key_data.energy = 1200
    key_data.size = 4
    key_data.color = (1.0, 0.95, 0.9)
    key = bpy.data.objects.new("KeyLight", key_data)
    key.location = (4, -5, 6)
    key.rotation_euler = (math.radians(55), 0, math.radians(40))
    scene.collection.objects.link(key)

    # Fill light
    fill_data = bpy.data.lights.new("FillLight", type='AREA')
    fill_data.energy = 400
    fill_data.size = 5
    fill_data.color = (0.85, 0.9, 1.0)
    fill = bpy.data.objects.new("FillLight", fill_data)
    fill.location = (-4, -3, 4)
    scene.collection.objects.link(fill)

    # Rim light
    rim_data = bpy.data.lights.new("RimLight", type='AREA')
    rim_data.energy = 600
    rim_data.size = 2
    rim = bpy.data.objects.new("RimLight", rim_data)
    rim.location = (0, 5, 5)
    scene.collection.objects.link(rim)

    # Camera
    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_data.lens = 85
    cam = bpy.data.objects.new("PreviewCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    cam.location = (3.5, -5, 1.8)
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    return cam

def render_preview(filepath, resolution=(1200, 1600)):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.filepath = filepath
    scene.render.image_settings.file_format = 'PNG'

    try:
        if hasattr(scene.eevee, 'use_gtao'):
            scene.eevee.use_gtao = True
        if hasattr(scene.eevee, 'use_bloom'):
            scene.eevee.use_bloom = True
    except:
        pass

    bpy.ops.render.render(write_still=True)
    print(f"PREVIEW_RENDERED: {filepath}")

def export_glb(filepath):
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
    )
    print(f"EXPORTED_GLB: {filepath}")

def main():
    args = parse_args()
    output_dir = args.get("output", OUTPUT_DIR)

    try:
        parent, parts = generate()
        target = (0, 0, 1.2)
        setup_scene(target, 2.0)

        preview_path = f"{output_dir}/{ASSET_NAME}_preview.png"
        render_preview(preview_path)

        glb_path = f"{output_dir}/{ASSET_NAME}.glb"
        export_glb(glb_path)

        info = {
            "status": "success",
            "name": ASSET_NAME,
            "parts_count": len(parts),
            "preview": preview_path,
            "glb": glb_path,
        }
        print(f"ASSET_INFO: {json.dumps(info)}")

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
