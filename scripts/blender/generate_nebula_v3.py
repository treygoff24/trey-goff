#!/usr/bin/env python3
"""
Nebula Billboard Generator v3 - Dramatic with proper perspective capture
Uses perspective camera from distance for better volumetric rendering.

Run: blender -b --python generate_nebula_v3.py --python-exit-code 1 -- output=/path/to/output
"""
import bpy
import sys
import os
import json
import math
from mathutils import Vector

OUTPUT_DIR = "/tmp/nebula_v3"
RESOLUTION = 1024

# Vibrant topic colors
TOPIC_COLORS = {
    "base": (1.0, 0.95, 1.0),
    "purple": (0.7, 0.3, 0.95),
    "blue": (0.3, 0.5, 1.0),
    "teal": (0.2, 0.85, 0.85),
    "gold": (1.0, 0.75, 0.25),
    "rose": (0.95, 0.4, 0.55),
    "green": (0.3, 0.9, 0.45),
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
    world = bpy.data.worlds.new("NebulaWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0


def create_nebula_material(name, color, density=15.0, emission=10.0):
    """Create volumetric nebula material with high emission."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (600, 0)

    volume = nodes.new("ShaderNodeVolumePrincipled")
    volume.location = (300, 0)
    links.new(volume.outputs["Volume"], output.inputs["Volume"])

    # Coordinates
    tex_coord = nodes.new("ShaderNodeTexCoord")
    tex_coord.location = (-600, 0)

    mapping = nodes.new("ShaderNodeMapping")
    mapping.location = (-400, 0)
    mapping.inputs["Scale"].default_value = (1.8, 1.8, 1.8)
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    # Noise for structure
    noise1 = nodes.new("ShaderNodeTexNoise")
    noise1.location = (-200, 150)
    noise1.noise_dimensions = '3D'
    noise1.inputs["Scale"].default_value = 2.0
    noise1.inputs["Detail"].default_value = 12.0
    noise1.inputs["Roughness"].default_value = 0.6
    noise1.inputs["Distortion"].default_value = 3.0
    links.new(mapping.outputs["Vector"], noise1.inputs["Vector"])

    # Secondary noise
    noise2 = nodes.new("ShaderNodeTexNoise")
    noise2.location = (-200, -100)
    noise2.noise_dimensions = '3D'
    noise2.inputs["Scale"].default_value = 4.0
    noise2.inputs["Detail"].default_value = 8.0
    noise2.inputs["Distortion"].default_value = 1.5
    links.new(mapping.outputs["Vector"], noise2.inputs["Vector"])

    # Combine
    mix = nodes.new("ShaderNodeMixRGB")
    mix.location = (0, 50)
    mix.blend_type = 'MULTIPLY'
    mix.inputs["Fac"].default_value = 0.5
    links.new(noise1.outputs["Fac"], mix.inputs["Color1"])
    links.new(noise2.outputs["Fac"], mix.inputs["Color2"])

    # Spherical falloff
    geometry = nodes.new("ShaderNodeNewGeometry")
    geometry.location = (-400, -300)

    length = nodes.new("ShaderNodeVectorMath")
    length.location = (-200, -300)
    length.operation = 'LENGTH'
    links.new(geometry.outputs["Position"], length.inputs[0])

    # Invert distance (1 at center, 0 at radius 1)
    sub = nodes.new("ShaderNodeMath")
    sub.location = (0, -300)
    sub.operation = 'SUBTRACT'
    sub.inputs[0].default_value = 1.0
    links.new(length.outputs["Value"], sub.inputs[1])

    # Power for soft edges
    power = nodes.new("ShaderNodeMath")
    power.location = (100, -300)
    power.operation = 'POWER'
    power.inputs[1].default_value = 1.5
    power.use_clamp = True
    links.new(sub.outputs["Value"], power.inputs[0])

    # Final density
    density_node = nodes.new("ShaderNodeMath")
    density_node.location = (150, 0)
    density_node.operation = 'MULTIPLY'
    links.new(mix.outputs["Color"], density_node.inputs[0])
    links.new(power.outputs["Value"], density_node.inputs[1])

    scale = nodes.new("ShaderNodeMath")
    scale.location = (250, 0)
    scale.operation = 'MULTIPLY'
    scale.inputs[1].default_value = density
    links.new(density_node.outputs["Value"], scale.inputs[0])
    links.new(scale.outputs["Value"], volume.inputs["Density"])

    # Emission color
    volume.inputs["Emission Color"].default_value = (*color, 1)
    volume.inputs["Emission Strength"].default_value = emission
    volume.inputs["Anisotropy"].default_value = 0.3

    # Absorption (darker)
    dark = tuple(c * 0.2 for c in color)
    volume.inputs["Color"].default_value = (*dark, 1)

    return mat


def create_nebula(emission_color):
    """Create multi-part nebula with irregular shape."""
    import random
    random.seed(42)

    scene = bpy.context.scene
    objects = []

    # Main body
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.5, location=(0, 0, 0))
    main = bpy.context.active_object
    main.name = "Nebula_Main"

    # Displace for irregular shape
    bpy.ops.object.modifier_add(type='DISPLACE')
    main.modifiers["Displace"].strength = 0.5
    tex = bpy.data.textures.new("MainDisp", type='CLOUDS')
    tex.noise_scale = 0.7
    tex.noise_depth = 4
    main.modifiers["Displace"].texture = tex
    bpy.ops.object.modifier_apply(modifier="Displace")

    mat_main = create_nebula_material("Mat_Main", emission_color, density=18.0, emission=12.0)
    main.data.materials.append(mat_main)
    objects.append(main)

    # Outer glow
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=2.2, location=(0.2, -0.1, 0))
    outer = bpy.context.active_object
    outer.name = "Nebula_Outer"

    bpy.ops.object.modifier_add(type='DISPLACE')
    outer.modifiers["Displace"].strength = 0.8
    tex2 = bpy.data.textures.new("OuterDisp", type='CLOUDS')
    tex2.noise_scale = 1.0
    outer.modifiers["Displace"].texture = tex2
    bpy.ops.object.modifier_apply(modifier="Displace")

    dim_color = tuple(c * 0.7 for c in emission_color)
    mat_outer = create_nebula_material("Mat_Outer", dim_color, density=8.0, emission=6.0)
    outer.data.materials.append(mat_outer)
    objects.append(outer)

    # Bright core
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.6, location=(-0.1, 0.05, 0))
    core = bpy.context.active_object
    core.name = "Nebula_Core"

    bpy.ops.object.modifier_add(type='DISPLACE')
    core.modifiers["Displace"].strength = 0.15
    tex3 = bpy.data.textures.new("CoreDisp", type='CLOUDS')
    tex3.noise_scale = 0.4
    core.modifiers["Displace"].texture = tex3
    bpy.ops.object.modifier_apply(modifier="Displace")

    bright = tuple(min(1.0, c * 1.3) for c in emission_color)
    mat_core = create_nebula_material("Mat_Core", bright, density=25.0, emission=20.0)
    core.data.materials.append(mat_core)
    objects.append(core)

    # Filament extensions
    filaments = [
        ((1.2, 0.6, 0.2), (0.35, 0.18, 0.12)),
        ((-0.9, -0.5, 0.4), (0.28, 0.14, 0.18)),
        ((0.15, 1.0, -0.3), (0.22, 0.3, 0.1)),
        ((-0.6, 0.3, -0.8), (0.18, 0.15, 0.25)),
    ]

    for i, (pos, scl) in enumerate(filaments):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.8, location=pos)
        fil = bpy.context.active_object
        fil.name = f"Filament_{i}"
        fil.scale = scl
        bpy.ops.object.transform_apply(scale=True)

        bpy.ops.object.modifier_add(type='DISPLACE')
        fil.modifiers["Displace"].strength = 0.15
        tex_f = bpy.data.textures.new(f"FilDisp_{i}", type='CLOUDS')
        tex_f.noise_scale = 0.3
        fil.modifiers["Displace"].texture = tex_f
        bpy.ops.object.modifier_apply(modifier="Displace")

        fil_color = tuple(c * (0.5 + i * 0.1) for c in emission_color)
        mat_fil = create_nebula_material(f"Mat_Fil_{i}", fil_color, density=12.0, emission=8.0)
        fil.data.materials.append(mat_fil)
        objects.append(fil)

    # Embedded stars
    for i in range(12):
        r = random.uniform(0.15, 1.4) ** 1.3
        theta = random.uniform(0, math.pi * 2)
        phi = random.uniform(0, math.pi)
        x = r * math.sin(phi) * math.cos(theta)
        y = r * math.sin(phi) * math.sin(theta)
        z = r * math.cos(phi)

        bpy.ops.mesh.primitive_uv_sphere_add(radius=random.uniform(0.012, 0.04), segments=8, ring_count=4, location=(x, y, z))
        star = bpy.context.active_object
        star.name = f"Star_{i}"

        mat_s = bpy.data.materials.new(f"StarMat_{i}")
        mat_s.use_nodes = True
        bsdf = mat_s.node_tree.nodes.get("Principled BSDF")
        tint = random.uniform(0, 0.3)
        star_col = (1.0 - tint * (1 - emission_color[0]), 1.0 - tint * (1 - emission_color[1]), 1.0 - tint * (1 - emission_color[2]), 1)
        bsdf.inputs["Emission Color"].default_value = star_col
        bsdf.inputs["Emission Strength"].default_value = random.uniform(40, 100)
        star.data.materials.append(mat_s)

    return main


def setup_camera():
    """Perspective camera from distance (flattens perspective, captures volume well)."""
    scene = bpy.context.scene

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = 'PERSP'
    cam_data.lens = 85  # Telephoto for flatter perspective

    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Far away, looking at center
    cam.location = (0, -12, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)

    return cam


def setup_lighting():
    """Minimal lighting - volumetrics are self-lit."""
    scene = bpy.context.scene

    # Subtle key
    key = bpy.data.lights.new("Key", type='POINT')
    key.energy = 50
    key.color = (1, 0.98, 0.95)
    key_obj = bpy.data.objects.new("Key", key)
    key_obj.location = (3, -4, 2)
    scene.collection.objects.link(key_obj)


def configure_render(resolution):
    scene = bpy.context.scene

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 200
    scene.cycles.use_denoising = True

    scene.cycles.volume_step_rate = 0.15
    scene.cycles.volume_max_steps = 1024

    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100

    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'


def render_nebula(output_dir, name, color):
    cleanup()
    create_nebula(color)
    setup_camera()
    setup_lighting()
    configure_render(RESOLUTION)

    filepath = os.path.join(output_dir, f"nebula_{name}.png")
    bpy.context.scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED: {filepath}")
    return f"nebula_{name}.png"


def main():
    args = parse_args()
    output_dir = args.get("output", OUTPUT_DIR)
    os.makedirs(output_dir, exist_ok=True)

    try:
        files = []
        for name, color in TOPIC_COLORS.items():
            print(f"Rendering {name}...")
            f = render_nebula(output_dir, name, color)
            files.append(f)

        print(f"ASSET_INFO: {json.dumps({'status': 'success', 'output_dir': output_dir, 'files': files})}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
