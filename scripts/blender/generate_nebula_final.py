#!/usr/bin/env python3
"""
Nebula Generator - Final Version
Uses the working v1 camera setup with multiple color variants.

Run: blender -b --python generate_nebula_final.py --python-exit-code 1 -- output=/path/to/output
"""
import bpy
import sys
import os
import json
import math
from mathutils import Vector

OUTPUT_DIR = "/tmp/nebula_final"
RESOLUTION = 1024

# Topic colors - vibrant for space nebula
TOPIC_COLORS = {
    "purple": (0.6, 0.3, 0.85),     # Philosophy
    "blue": (0.35, 0.55, 1.0),      # Technology
    "teal": (0.25, 0.8, 0.75),      # Science
    "gold": (0.95, 0.7, 0.3),       # History
    "rose": (0.9, 0.45, 0.55),      # Art
    "green": (0.35, 0.85, 0.5),     # Nature
    "coral": (1.0, 0.5, 0.4),       # Fiction
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


def create_nebula_volume(emission_color):
    """
    Create volumetric nebula - based on working v1.
    """
    scene = bpy.context.scene

    # Main nebula sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=2.0,
        segments=32,
        ring_count=16,
        location=(0, 0, 0)
    )
    nebula = bpy.context.active_object
    nebula.name = "Nebula_Main"

    # Create volumetric material
    mat = bpy.data.materials.new("NebulaMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (600, 0)

    volume = nodes.new("ShaderNodeVolumePrincipled")
    volume.location = (300, 0)
    links.new(volume.outputs["Volume"], output.inputs["Volume"])

    # Texture coordinates
    tex_coord = nodes.new("ShaderNodeTexCoord")
    tex_coord.location = (-800, 0)

    mapping = nodes.new("ShaderNodeMapping")
    mapping.location = (-600, 0)
    mapping.inputs["Scale"].default_value = (1.5, 1.5, 1.5)
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    # Primary noise (large structure with filaments)
    noise1 = nodes.new("ShaderNodeTexNoise")
    noise1.location = (-400, 200)
    noise1.noise_dimensions = '3D'
    noise1.inputs["Scale"].default_value = 2.0
    noise1.inputs["Detail"].default_value = 8.0
    noise1.inputs["Roughness"].default_value = 0.6
    noise1.inputs["Distortion"].default_value = 1.5
    links.new(mapping.outputs["Vector"], noise1.inputs["Vector"])

    # Secondary noise (wisps)
    noise2 = nodes.new("ShaderNodeTexNoise")
    noise2.location = (-400, -100)
    noise2.noise_dimensions = '3D'
    noise2.inputs["Scale"].default_value = 5.0
    noise2.inputs["Detail"].default_value = 12.0
    noise2.inputs["Roughness"].default_value = 0.7
    noise2.inputs["Distortion"].default_value = 0.8
    links.new(mapping.outputs["Vector"], noise2.inputs["Vector"])

    # Curl-like distortion
    noise3 = nodes.new("ShaderNodeTexNoise")
    noise3.location = (-400, -400)
    noise3.noise_dimensions = '3D'
    noise3.inputs["Scale"].default_value = 1.0
    noise3.inputs["Detail"].default_value = 4.0
    noise3.inputs["Distortion"].default_value = 3.0
    links.new(mapping.outputs["Vector"], noise3.inputs["Vector"])

    # Mix noises
    mix1 = nodes.new("ShaderNodeMixRGB")
    mix1.location = (-200, 100)
    mix1.blend_type = 'MULTIPLY'
    mix1.inputs["Fac"].default_value = 0.7
    links.new(noise1.outputs["Fac"], mix1.inputs["Color1"])
    links.new(noise2.outputs["Fac"], mix1.inputs["Color2"])

    mix2 = nodes.new("ShaderNodeMixRGB")
    mix2.location = (0, 100)
    mix2.blend_type = 'OVERLAY'
    mix2.inputs["Fac"].default_value = 0.4
    links.new(mix1.outputs["Color"], mix2.inputs["Color1"])
    links.new(noise3.outputs["Fac"], mix2.inputs["Color2"])

    # Spherical falloff
    geometry = nodes.new("ShaderNodeNewGeometry")
    geometry.location = (-600, -600)

    vec_length = nodes.new("ShaderNodeVectorMath")
    vec_length.location = (-400, -600)
    vec_length.operation = 'LENGTH'
    links.new(geometry.outputs["Position"], vec_length.inputs[0])

    divide = nodes.new("ShaderNodeMath")
    divide.location = (-200, -600)
    divide.operation = 'DIVIDE'
    divide.inputs[1].default_value = 2.0
    links.new(vec_length.outputs["Value"], divide.inputs[0])

    subtract = nodes.new("ShaderNodeMath")
    subtract.location = (0, -600)
    subtract.operation = 'SUBTRACT'
    subtract.inputs[0].default_value = 1.0
    links.new(divide.outputs["Value"], subtract.inputs[1])

    power = nodes.new("ShaderNodeMath")
    power.location = (100, -600)
    power.operation = 'POWER'
    power.inputs[1].default_value = 2.0
    power.use_clamp = True
    links.new(subtract.outputs["Value"], power.inputs[0])

    # Final density
    density_mult = nodes.new("ShaderNodeMath")
    density_mult.location = (100, 0)
    density_mult.operation = 'MULTIPLY'
    links.new(mix2.outputs["Color"], density_mult.inputs[0])
    links.new(power.outputs["Value"], density_mult.inputs[1])

    density_scale = nodes.new("ShaderNodeMath")
    density_scale.location = (200, 0)
    density_scale.operation = 'MULTIPLY'
    density_scale.inputs[1].default_value = 15.0
    links.new(density_mult.outputs["Value"], density_scale.inputs[0])
    links.new(density_scale.outputs["Value"], volume.inputs["Density"])

    # Emission
    emission_ramp = nodes.new("ShaderNodeValToRGB")
    emission_ramp.location = (100, -200)
    emission_ramp.color_ramp.elements[0].position = 0.4
    emission_ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    emission_ramp.color_ramp.elements[1].position = 0.8
    emission_ramp.color_ramp.elements[1].color = (*emission_color, 1)
    links.new(mix2.outputs["Color"], emission_ramp.inputs["Fac"])

    emission_final = nodes.new("ShaderNodeMixRGB")
    emission_final.location = (200, -200)
    emission_final.blend_type = 'MULTIPLY'
    links.new(power.outputs["Value"], emission_final.inputs["Fac"])
    links.new(emission_ramp.outputs["Color"], emission_final.inputs["Color1"])
    emission_final.inputs["Color2"].default_value = (1, 1, 1, 1)

    links.new(emission_final.outputs["Color"], volume.inputs["Emission Color"])
    volume.inputs["Emission Strength"].default_value = 3.0
    volume.inputs["Anisotropy"].default_value = 0.3

    # Base color (absorption)
    base_color = tuple(c * 0.3 for c in emission_color)
    volume.inputs["Color"].default_value = (*base_color, 1)

    nebula.data.materials.append(mat)
    return nebula


def add_internal_stars(base_color):
    """Add emissive stars inside nebula."""
    import random
    random.seed(42)

    for i in range(12):
        r = random.uniform(0.3, 1.5)
        theta = random.uniform(0, math.pi * 2)
        phi = random.uniform(0, math.pi)
        x = r * math.sin(phi) * math.cos(theta)
        y = r * math.sin(phi) * math.sin(theta)
        z = r * math.cos(phi)

        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=random.uniform(0.02, 0.06),
            segments=8,
            ring_count=4,
            location=(x, y, z)
        )
        star = bpy.context.active_object
        star.name = f"Star_{i}"

        mat = bpy.data.materials.new(f"StarMat_{i}")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")

        # Color variation from white to tinted
        tint = random.uniform(0, 0.4)
        star_color = (
            1.0 - tint * (1 - base_color[0]),
            1.0 - tint * (1 - base_color[1]),
            1.0 - tint * (1 - base_color[2]),
            1
        )
        bsdf.inputs["Emission Color"].default_value = star_color
        bsdf.inputs["Emission Strength"].default_value = random.uniform(20, 50)
        star.data.materials.append(mat)


def setup_camera(distance=5):
    """Perspective camera - same setup that worked in v1."""
    scene = bpy.context.scene

    cam_data = bpy.data.cameras.new("Camera")
    cam = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Position at angle (like v1 hero)
    cam.location = (distance * 0.7, -distance * 0.7, distance * 0.4)

    # Point at center
    direction = Vector((0, 0, 0)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    return cam


def setup_lighting(distance=5):
    """Three-point lighting."""
    scene = bpy.context.scene

    # Key light
    key_data = bpy.data.lights.new("Key", type='AREA')
    key_data.energy = 1000
    key_data.size = 2
    key = bpy.data.objects.new("Key", key_data)
    key.location = (distance, -distance, distance)
    key.rotation_euler = (math.radians(45), 0, math.radians(45))
    scene.collection.objects.link(key)

    # Fill
    fill_data = bpy.data.lights.new("Fill", type='AREA')
    fill_data.energy = 300
    fill_data.size = 3
    fill = bpy.data.objects.new("Fill", fill_data)
    fill.location = (-distance * 0.8, -distance * 0.5, distance * 0.5)
    scene.collection.objects.link(fill)

    # Rim
    rim_data = bpy.data.lights.new("Rim", type='AREA')
    rim_data.energy = 500
    rim_data.size = 1
    rim = bpy.data.objects.new("Rim", rim_data)
    rim.location = (0, distance, distance * 0.8)
    scene.collection.objects.link(rim)


def configure_render(resolution):
    scene = bpy.context.scene

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 256
    scene.cycles.use_denoising = True

    scene.cycles.volume_step_rate = 0.25
    scene.cycles.volume_max_steps = 1024

    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100

    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'


def render_nebula(output_dir, name, color):
    """Render a single nebula variant."""
    cleanup()

    nebula = create_nebula_volume(color)
    add_internal_stars(color)

    size = max(nebula.dimensions)
    distance = size * 2.5

    setup_lighting(distance)
    setup_camera(distance)
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

        info = {
            "status": "success",
            "output_dir": output_dir,
            "resolution": RESOLUTION,
            "files": files
        }
        print(f"ASSET_INFO: {json.dumps(info)}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
