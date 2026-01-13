#!/usr/bin/env python3
"""
God Gundam (Burning Gundam) 3D Model Generator
Run: blender -b --python god_gundam_v1.py --python-exit-code 1 -- output=/tmp
"""
import bpy
import bmesh
import sys
import json
import math
from mathutils import Vector, Matrix

# ============================================================
# CONFIGURATION
# ============================================================
OUTPUT_DIR = "/tmp"
ASSET_NAME = "GodGundam"

# Scale: 1 unit = 1 meter, Gundam is ~16.6m tall
# We'll make it smaller for practical viewing: ~2m tall model
SCALE = 2.0

# ============================================================
# COLOR PALETTE (God Gundam)
# ============================================================
COLORS = {
    'white': (0.9, 0.9, 0.92),
    'light_gray': (0.7, 0.7, 0.72),
    'dark_gray': (0.25, 0.25, 0.27),
    'blue': (0.1, 0.15, 0.5),
    'dark_blue': (0.05, 0.08, 0.35),
    'red': (0.8, 0.1, 0.1),
    'dark_red': (0.5, 0.05, 0.05),
    'gold': (0.85, 0.65, 0.15),
    'orange': (0.9, 0.5, 0.1),
    'green': (0.1, 0.8, 0.3),  # For visor
    'black': (0.02, 0.02, 0.02),
}

# ============================================================
# UTILITY FUNCTIONS
# ============================================================
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
    if isinstance(color, str):
        h = color.lstrip('#')
        color = tuple(int(h[i:i+2], 16)/255 for i in (0,2,4))
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission > 0:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission
    return mat

def get_material(name):
    return bpy.data.materials.get(name)

def setup_materials():
    """Pre-create all materials."""
    materials = {}
    materials['white'] = create_material("GG_White", COLORS['white'], roughness=0.3, metallic=0.2)
    materials['light_gray'] = create_material("GG_LightGray", COLORS['light_gray'], roughness=0.4, metallic=0.3)
    materials['dark_gray'] = create_material("GG_DarkGray", COLORS['dark_gray'], roughness=0.5, metallic=0.4)
    materials['blue'] = create_material("GG_Blue", COLORS['blue'], roughness=0.3, metallic=0.3)
    materials['dark_blue'] = create_material("GG_DarkBlue", COLORS['dark_blue'], roughness=0.4, metallic=0.3)
    materials['red'] = create_material("GG_Red", COLORS['red'], roughness=0.3, metallic=0.2)
    materials['gold'] = create_material("GG_Gold", COLORS['gold'], roughness=0.2, metallic=0.8)
    materials['orange'] = create_material("GG_Orange", COLORS['orange'], roughness=0.3, metallic=0.2, emission=0.5)
    materials['green'] = create_material("GG_Green", COLORS['green'], roughness=0.1, metallic=0.1, emission=2.0)
    materials['black'] = create_material("GG_Black", COLORS['black'], roughness=0.6, metallic=0.3)
    return materials

def apply_material(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def join_objects(objects, name):
    """Join multiple objects into one."""
    if not objects:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    result = bpy.context.active_object
    result.name = name
    return result

def create_beveled_cube(size, location, bevel=0.02, name="BeveledCube"):
    """Create a cube with beveled edges for that mecha panel look."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0]/2, size[1]/2, size[2]/2)
    bpy.ops.object.transform_apply(scale=True)

    # Add bevel modifier
    bevel_mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel_mod.width = bevel
    bevel_mod.segments = 2
    bevel_mod.limit_method = 'ANGLE'
    bpy.ops.object.modifier_apply(modifier="Bevel")

    return obj

# ============================================================
# BODY PARTS
# ============================================================

def create_head(mats, base_z):
    """Create the Gundam head with V-fin."""
    parts = []
    head_y = 0
    head_z = base_z

    # Main head shape - angular helmet
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, head_y, head_z))
    helmet = bpy.context.active_object
    helmet.name = "Head_Helmet"
    helmet.scale = (0.12, 0.14, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(helmet, mats['white'])
    parts.append(helmet)

    # Face plate (blue section)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, head_y - 0.06, head_z - 0.02))
    face = bpy.context.active_object
    face.name = "Head_Face"
    face.scale = (0.08, 0.04, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(face, mats['blue'])
    parts.append(face)

    # Visor (green glowing eyes)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, head_y - 0.085, head_z))
    visor = bpy.context.active_object
    visor.name = "Head_Visor"
    visor.scale = (0.07, 0.01, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(visor, mats['green'])
    parts.append(visor)

    # Chin (red)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, head_y - 0.07, head_z - 0.06))
    chin = bpy.context.active_object
    chin.name = "Head_Chin"
    chin.scale = (0.04, 0.02, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(chin, mats['red'])
    parts.append(chin)

    # V-Fin (gold) - center
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.015, radius2=0.003, depth=0.15,
                                     location=(0, head_y - 0.02, head_z + 0.12))
    vfin_center = bpy.context.active_object
    vfin_center.name = "Head_VFin_Center"
    vfin_center.rotation_euler = (math.radians(-15), 0, 0)
    apply_material(vfin_center, mats['gold'])
    parts.append(vfin_center)

    # V-Fin left
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.012, radius2=0.002, depth=0.18,
                                     location=(-0.06, head_y - 0.01, head_z + 0.1))
    vfin_left = bpy.context.active_object
    vfin_left.name = "Head_VFin_Left"
    vfin_left.rotation_euler = (math.radians(-30), math.radians(-35), 0)
    apply_material(vfin_left, mats['gold'])
    parts.append(vfin_left)

    # V-Fin right
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.012, radius2=0.002, depth=0.18,
                                     location=(0.06, head_y - 0.01, head_z + 0.1))
    vfin_right = bpy.context.active_object
    vfin_right.name = "Head_VFin_Right"
    vfin_right.rotation_euler = (math.radians(-30), math.radians(35), 0)
    apply_material(vfin_right, mats['gold'])
    parts.append(vfin_right)

    # Head crest (white fin on top)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, head_y + 0.02, head_z + 0.08))
    crest = bpy.context.active_object
    crest.name = "Head_Crest"
    crest.scale = (0.01, 0.06, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(crest, mats['white'])
    parts.append(crest)

    return parts

def create_torso(mats, base_z):
    """Create the main torso/chest."""
    parts = []
    torso_z = base_z

    # Main chest (blue core)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, torso_z))
    chest = bpy.context.active_object
    chest.name = "Torso_Chest"
    chest.scale = (0.22, 0.15, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(chest, mats['blue'])
    parts.append(chest)

    # Upper chest plate (white collar area)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.02, torso_z + 0.12))
    collar = bpy.context.active_object
    collar.name = "Torso_Collar"
    collar.scale = (0.18, 0.08, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(collar, mats['white'])
    parts.append(collar)

    # Center cockpit area (red)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.08, torso_z + 0.02))
    cockpit = bpy.context.active_object
    cockpit.name = "Torso_Cockpit"
    cockpit.scale = (0.08, 0.03, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(cockpit, mats['red'])
    parts.append(cockpit)

    # Chest vents (gold/orange) - left
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.08, -0.08, torso_z + 0.05))
    vent_l = bpy.context.active_object
    vent_l.name = "Torso_Vent_L"
    vent_l.scale = (0.04, 0.02, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(vent_l, mats['orange'])
    parts.append(vent_l)

    # Chest vents - right
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.08, -0.08, torso_z + 0.05))
    vent_r = bpy.context.active_object
    vent_r.name = "Torso_Vent_R"
    vent_r.scale = (0.04, 0.02, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(vent_r, mats['orange'])
    parts.append(vent_r)

    # Waist (dark gray)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, torso_z - 0.18))
    waist = bpy.context.active_object
    waist.name = "Torso_Waist"
    waist.scale = (0.14, 0.1, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(waist, mats['dark_gray'])
    parts.append(waist)

    # Neck connector
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.06, location=(0, 0, torso_z + 0.2))
    neck = bpy.context.active_object
    neck.name = "Torso_Neck"
    apply_material(neck, mats['dark_gray'])
    parts.append(neck)

    return parts

def create_shoulder(mats, side, base_z):
    """Create a shoulder armor piece."""
    parts = []
    x_mult = 1 if side == 'right' else -1
    x_pos = x_mult * 0.22
    shoulder_z = base_z

    # Main shoulder block (white)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, shoulder_z))
    main = bpy.context.active_object
    main.name = f"Shoulder_{side}_Main"
    main.scale = (0.1, 0.18, 0.16)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(main, mats['white'])
    parts.append(main)

    # Upper shoulder armor (large white piece)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos + x_mult * 0.06, 0, shoulder_z + 0.1))
    upper = bpy.context.active_object
    upper.name = f"Shoulder_{side}_Upper"
    upper.scale = (0.12, 0.22, 0.12)
    upper.rotation_euler = (0, x_mult * math.radians(-15), 0)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    apply_material(upper, mats['white'])
    parts.append(upper)

    # Red trim on top
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos + x_mult * 0.08, 0, shoulder_z + 0.18))
    red_trim = bpy.context.active_object
    red_trim.name = f"Shoulder_{side}_RedTrim"
    red_trim.scale = (0.1, 0.2, 0.03)
    red_trim.rotation_euler = (0, x_mult * math.radians(-15), 0)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    apply_material(red_trim, mats['red'])
    parts.append(red_trim)

    # Black vents underneath
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, -0.08, shoulder_z - 0.02))
    vents = bpy.context.active_object
    vents.name = f"Shoulder_{side}_Vents"
    vents.scale = (0.08, 0.06, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(vents, mats['black'])
    parts.append(vents)

    return parts

def create_arm(mats, side, base_z):
    """Create an arm."""
    parts = []
    x_mult = 1 if side == 'right' else -1
    x_pos = x_mult * 0.26
    arm_z = base_z

    # Upper arm (blue)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, arm_z))
    upper = bpy.context.active_object
    upper.name = f"Arm_{side}_Upper"
    upper.scale = (0.06, 0.07, 0.14)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(upper, mats['blue'])
    parts.append(upper)

    # Elbow joint
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.06, location=(x_pos, 0, arm_z - 0.12))
    elbow = bpy.context.active_object
    elbow.name = f"Arm_{side}_Elbow"
    elbow.rotation_euler = (0, math.radians(90), 0)
    apply_material(elbow, mats['dark_gray'])
    parts.append(elbow)

    # Forearm (white)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, arm_z - 0.26))
    forearm = bpy.context.active_object
    forearm.name = f"Arm_{side}_Forearm"
    forearm.scale = (0.055, 0.065, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(forearm, mats['white'])
    parts.append(forearm)

    # Forearm armor panel
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos + x_mult * 0.04, 0, arm_z - 0.24))
    forearm_armor = bpy.context.active_object
    forearm_armor.name = f"Arm_{side}_ForearmArmor"
    forearm_armor.scale = (0.03, 0.05, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(forearm_armor, mats['white'])
    parts.append(forearm_armor)

    # Hand (dark gray)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, -0.01, arm_z - 0.38))
    hand = bpy.context.active_object
    hand.name = f"Arm_{side}_Hand"
    hand.scale = (0.04, 0.05, 0.05)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(hand, mats['dark_gray'])
    parts.append(hand)

    # Finger details
    for i, offset in enumerate([-0.02, 0, 0.02]):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos + offset, -0.04, arm_z - 0.4))
        finger = bpy.context.active_object
        finger.name = f"Arm_{side}_Finger_{i}"
        finger.scale = (0.01, 0.02, 0.03)
        bpy.ops.object.transform_apply(scale=True)
        apply_material(finger, mats['dark_gray'])
        parts.append(finger)

    return parts

def create_skirt_armor(mats, base_z):
    """Create the skirt/hip armor."""
    parts = []
    skirt_z = base_z

    # Front skirt center (white)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.1, skirt_z))
    front_center = bpy.context.active_object
    front_center.name = "Skirt_FrontCenter"
    front_center.scale = (0.1, 0.02, 0.12)
    front_center.rotation_euler = (math.radians(15), 0, 0)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    apply_material(front_center, mats['white'])
    parts.append(front_center)

    # Front skirt sides (white with blue)
    for side, x_mult in [('left', -1), ('right', 1)]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_mult * 0.1, -0.08, skirt_z))
        panel = bpy.context.active_object
        panel.name = f"Skirt_Front_{side}"
        panel.scale = (0.08, 0.02, 0.14)
        panel.rotation_euler = (math.radians(20), x_mult * math.radians(-10), 0)
        bpy.ops.object.transform_apply(rotation=True, scale=True)
        apply_material(panel, mats['white'])
        parts.append(panel)

        # Blue accent
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_mult * 0.1, -0.09, skirt_z - 0.04))
        accent = bpy.context.active_object
        accent.name = f"Skirt_FrontAccent_{side}"
        accent.scale = (0.06, 0.015, 0.06)
        accent.rotation_euler = (math.radians(20), x_mult * math.radians(-10), 0)
        bpy.ops.object.transform_apply(rotation=True, scale=True)
        apply_material(accent, mats['blue'])
        parts.append(accent)

    # Side skirt armor (larger panels)
    for side, x_mult in [('left', -1), ('right', 1)]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_mult * 0.16, 0, skirt_z - 0.02))
        side_panel = bpy.context.active_object
        side_panel.name = f"Skirt_Side_{side}"
        side_panel.scale = (0.04, 0.12, 0.16)
        bpy.ops.object.transform_apply(scale=True)
        apply_material(side_panel, mats['white'])
        parts.append(side_panel)

    # Rear skirt
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.1, skirt_z - 0.02))
    rear = bpy.context.active_object
    rear.name = "Skirt_Rear"
    rear.scale = (0.14, 0.03, 0.14)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(rear, mats['white'])
    parts.append(rear)

    return parts

def create_leg(mats, side, base_z):
    """Create a leg."""
    parts = []
    x_mult = 1 if side == 'right' else -1
    x_pos = x_mult * 0.1
    leg_z = base_z

    # Hip joint
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, location=(x_pos, 0, leg_z + 0.08))
    hip = bpy.context.active_object
    hip.name = f"Leg_{side}_Hip"
    apply_material(hip, mats['dark_gray'])
    parts.append(hip)

    # Upper leg / thigh (white)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, leg_z - 0.08))
    thigh = bpy.context.active_object
    thigh.name = f"Leg_{side}_Thigh"
    thigh.scale = (0.08, 0.1, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(thigh, mats['white'])
    parts.append(thigh)

    # Thigh armor detail
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos + x_mult * 0.05, -0.03, leg_z - 0.06))
    thigh_armor = bpy.context.active_object
    thigh_armor.name = f"Leg_{side}_ThighArmor"
    thigh_armor.scale = (0.03, 0.06, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(thigh_armor, mats['light_gray'])
    parts.append(thigh_armor)

    # Knee (blue)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, -0.02, leg_z - 0.22))
    knee = bpy.context.active_object
    knee.name = f"Leg_{side}_Knee"
    knee.scale = (0.07, 0.08, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(knee, mats['blue'])
    parts.append(knee)

    # Lower leg / shin (white)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, leg_z - 0.4))
    shin = bpy.context.active_object
    shin.name = f"Leg_{side}_Shin"
    shin.scale = (0.07, 0.09, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(shin, mats['white'])
    parts.append(shin)

    # Shin armor (front blue panel)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, -0.06, leg_z - 0.38))
    shin_armor = bpy.context.active_object
    shin_armor.name = f"Leg_{side}_ShinArmor"
    shin_armor.scale = (0.05, 0.03, 0.14)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(shin_armor, mats['blue'])
    parts.append(shin_armor)

    # Calf armor (back)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0.06, leg_z - 0.36))
    calf = bpy.context.active_object
    calf.name = f"Leg_{side}_Calf"
    calf.scale = (0.06, 0.04, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(calf, mats['light_gray'])
    parts.append(calf)

    # Ankle
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.05, location=(x_pos, 0, leg_z - 0.52))
    ankle = bpy.context.active_object
    ankle.name = f"Leg_{side}_Ankle"
    apply_material(ankle, mats['dark_gray'])
    parts.append(ankle)

    # Foot (white with red toe)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, -0.04, leg_z - 0.58))
    foot = bpy.context.active_object
    foot.name = f"Leg_{side}_Foot"
    foot.scale = (0.06, 0.12, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(foot, mats['white'])
    parts.append(foot)

    # Foot toe (red)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, -0.1, leg_z - 0.58))
    toe = bpy.context.active_object
    toe.name = f"Leg_{side}_Toe"
    toe.scale = (0.05, 0.04, 0.035)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(toe, mats['red'])
    parts.append(toe)

    # Heel
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0.04, leg_z - 0.58))
    heel = bpy.context.active_object
    heel.name = f"Leg_{side}_Heel"
    heel.scale = (0.05, 0.04, 0.035)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(heel, mats['white'])
    parts.append(heel)

    # Ankle guard (white band)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, leg_z - 0.54))
    ankle_guard = bpy.context.active_object
    ankle_guard.name = f"Leg_{side}_AnkleGuard"
    ankle_guard.scale = (0.07, 0.08, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(ankle_guard, mats['white'])
    parts.append(ankle_guard)

    return parts

def create_back_wing(mats, side, position, base_z):
    """Create a back wing binder."""
    parts = []
    x_mult = 1 if side == 'right' else -1
    y_offset = 0.05 if position == 'upper' else -0.05
    z_offset = 0.08 if position == 'upper' else -0.04

    x_pos = x_mult * 0.12
    wing_z = base_z + z_offset

    # Wing mount
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0.12 + y_offset, wing_z))
    mount = bpy.context.active_object
    mount.name = f"Wing_{side}_{position}_Mount"
    mount.scale = (0.04, 0.06, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(mount, mats['dark_gray'])
    parts.append(mount)

    # Main wing blade (white)
    wing_angle_y = x_mult * math.radians(25)
    wing_angle_x = math.radians(-20) if position == 'upper' else math.radians(10)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos + x_mult * 0.15, 0.2 + y_offset, wing_z + 0.1))
    blade = bpy.context.active_object
    blade.name = f"Wing_{side}_{position}_Blade"
    blade.scale = (0.02, 0.35, 0.08)
    blade.rotation_euler = (wing_angle_x, wing_angle_y, 0)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    apply_material(blade, mats['white'])
    parts.append(blade)

    # Red trim on wing
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos + x_mult * 0.18, 0.25 + y_offset, wing_z + 0.12))
    red_trim = bpy.context.active_object
    red_trim.name = f"Wing_{side}_{position}_RedTrim"
    red_trim.scale = (0.015, 0.25, 0.04)
    red_trim.rotation_euler = (wing_angle_x, wing_angle_y, 0)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    apply_material(red_trim, mats['red'])
    parts.append(red_trim)

    return parts

def create_backpack(mats, base_z):
    """Create the backpack unit."""
    parts = []
    pack_z = base_z

    # Main backpack body
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.12, pack_z))
    main = bpy.context.active_object
    main.name = "Backpack_Main"
    main.scale = (0.16, 0.08, 0.16)
    bpy.ops.object.transform_apply(scale=True)
    apply_material(main, mats['white'])
    parts.append(main)

    # Thruster housings
    for side, x_mult in [('left', -1), ('right', 1)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.06, location=(x_mult * 0.08, 0.16, pack_z - 0.04))
        thruster = bpy.context.active_object
        thruster.name = f"Backpack_Thruster_{side}"
        thruster.rotation_euler = (math.radians(90), 0, 0)
        apply_material(thruster, mats['dark_gray'])
        parts.append(thruster)

    # Wing mounts (where wings attach)
    for side, x_mult in [('left', -1), ('right', 1)]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_mult * 0.1, 0.1, pack_z + 0.06))
        wing_mount = bpy.context.active_object
        wing_mount.name = f"Backpack_WingMount_{side}"
        wing_mount.scale = (0.04, 0.04, 0.08)
        bpy.ops.object.transform_apply(scale=True)
        apply_material(wing_mount, mats['light_gray'])
        parts.append(wing_mount)

    return parts

# ============================================================
# MAIN GENERATION
# ============================================================
def generate():
    cleanup()

    # Create materials
    mats = setup_materials()

    # Body part vertical positions (base heights)
    # Total height ~2m (scaled model)
    foot_z = 0
    leg_base_z = 0.6
    torso_z = 1.2
    shoulder_z = 1.35
    arm_z = 1.15
    head_z = 1.55
    skirt_z = 0.85
    backpack_z = 1.2

    all_parts = []

    # Generate all body parts
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

    print("Creating skirt armor...")
    all_parts.extend(create_skirt_armor(mats, skirt_z))

    print("Creating legs...")
    all_parts.extend(create_leg(mats, 'left', leg_base_z))
    all_parts.extend(create_leg(mats, 'right', leg_base_z))

    print("Creating backpack...")
    all_parts.extend(create_backpack(mats, backpack_z))

    print("Creating wing binders...")
    all_parts.extend(create_back_wing(mats, 'left', 'upper', backpack_z))
    all_parts.extend(create_back_wing(mats, 'right', 'upper', backpack_z))
    all_parts.extend(create_back_wing(mats, 'left', 'lower', backpack_z))
    all_parts.extend(create_back_wing(mats, 'right', 'lower', backpack_z))

    # Create empty parent for the whole model
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    parent = bpy.context.active_object
    parent.name = ASSET_NAME

    # Parent all parts to the empty
    for part in all_parts:
        part.parent = parent

    return parent, all_parts

def setup_scene(target_location, size):
    """Setup lighting and camera for preview."""
    scene = bpy.context.scene

    # Set world background
    scene.world = bpy.data.worlds.new("GundamWorld")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.05, 0.05, 0.08, 1.0)  # Dark blue-gray
    bg.inputs["Strength"].default_value = 0.5

    # Key light
    key_data = bpy.data.lights.new("KeyLight", type='AREA')
    key_data.energy = 800
    key_data.size = 3
    key = bpy.data.objects.new("KeyLight", key_data)
    key.location = (3, -4, 5)
    key.rotation_euler = (math.radians(50), 0, math.radians(35))
    scene.collection.objects.link(key)

    # Fill light
    fill_data = bpy.data.lights.new("FillLight", type='AREA')
    fill_data.energy = 300
    fill_data.size = 4
    fill = bpy.data.objects.new("FillLight", fill_data)
    fill.location = (-3, -2, 3)
    scene.collection.objects.link(fill)

    # Rim light
    rim_data = bpy.data.lights.new("RimLight", type='AREA')
    rim_data.energy = 400
    rim_data.size = 2
    rim = bpy.data.objects.new("RimLight", rim_data)
    rim.location = (0, 4, 4)
    scene.collection.objects.link(rim)

    # Camera
    cam_data = bpy.data.cameras.new("PreviewCam")
    cam = bpy.data.objects.new("PreviewCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Position camera
    cam.location = (2.5, -4, 1.5)
    direction = Vector(target_location) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    return cam

def render_preview(filepath, resolution=(1200, 1600)):
    """Render preview image."""
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.filepath = filepath
    scene.render.image_settings.file_format = 'PNG'

    # Try to set Eevee settings (may vary by Blender version)
    try:
        if hasattr(scene.eevee, 'use_gtao'):
            scene.eevee.use_gtao = True
        if hasattr(scene.eevee, 'use_bloom'):
            scene.eevee.use_bloom = True
    except:
        pass  # Skip if settings don't exist in this Blender version

    bpy.ops.render.render(write_still=True)
    print(f"PREVIEW_RENDERED: {filepath}")

def export_glb(filepath):
    """Export as GLB."""
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
        # Generate the Gundam
        parent, parts = generate()

        # Setup scene
        target = (0, 0, 1.0)  # Center of model
        setup_scene(target, 2.0)

        # Render preview
        preview_path = f"{output_dir}/{ASSET_NAME}_preview.png"
        render_preview(preview_path)

        # Export GLB
        glb_path = f"{output_dir}/{ASSET_NAME}.glb"
        export_glb(glb_path)

        # Output info
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
