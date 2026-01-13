#!/usr/bin/env python3
"""
Nebula Billboard Generator v2 - Dramatic Filamentous Design
Creates high-quality nebula billboard textures for the Floating Library.

Run: blender -b --python generate_nebula_v2.py --python-exit-code 1 -- output=/path/to/output

Output:
- nebula_base.png - Grayscale/neutral nebula for runtime tinting
- nebula_purple.png, nebula_blue.png, etc. - Pre-colored variants
"""
import bpy
import sys
import os
import json
import math
from mathutils import Vector

# ============================================================
# CONFIGURATION
# ============================================================
OUTPUT_DIR = "/tmp/nebula_v2"
RESOLUTION = 1024  # Square texture

# Topic colors from the library (will tint the base nebula)
TOPIC_COLORS = {
    "base": (0.9, 0.9, 0.95),      # Near-white for runtime tinting
    "purple": (0.6, 0.3, 0.8),     # Philosophy/deep topics
    "blue": (0.3, 0.5, 0.9),       # Technology/science
    "teal": (0.2, 0.7, 0.7),       # Nature/environment
    "gold": (0.9, 0.7, 0.3),       # History/wisdom
    "rose": (0.8, 0.4, 0.5),       # Art/creativity
    "green": (0.3, 0.7, 0.4),      # Growth/learning
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
    """Reset to clean state."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    world = bpy.data.worlds.new("NebulaWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0


def create_filamentous_nebula(emission_color=(0.8, 0.6, 1.0)):
    """
    Create a dramatic nebula with filaments, wisps, and irregular edges.
    Uses multiple overlapping volumes with heavy domain warping.
    """
    scene = bpy.context.scene

    # === MAIN NEBULA BODY (irregular blob, not sphere) ===
    # Start with icosphere for more organic base
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=3,
        radius=2.0,
        location=(0, 0, 0)
    )
    main_body = bpy.context.active_object
    main_body.name = "Nebula_Body"

    # Displace vertices for irregular shape
    bpy.ops.object.modifier_add(type='DISPLACE')
    displace = main_body.modifiers["Displace"]

    # Create noise texture for displacement
    noise_tex = bpy.data.textures.new("NebulaDisplace", type='CLOUDS')
    noise_tex.noise_scale = 0.8
    noise_tex.noise_depth = 4
    displace.texture = noise_tex
    displace.strength = 0.6
    displace.texture_coords = 'GLOBAL'

    # Apply modifier
    bpy.ops.object.modifier_apply(modifier="Displace")

    # Create the main volumetric material
    mat = create_nebula_material("NebulaMat_Main", emission_color, density=12.0)
    main_body.data.materials.append(mat)

    # === OUTER WISPS (larger, more diffuse) ===
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2,
        radius=2.8,
        location=(0.3, -0.2, 0.1)
    )
    outer = bpy.context.active_object
    outer.name = "Nebula_Outer"

    # Heavy displacement for wispy edges
    bpy.ops.object.modifier_add(type='DISPLACE')
    displace2 = outer.modifiers["Displace"]
    noise_tex2 = bpy.data.textures.new("OuterDisplace", type='CLOUDS')
    noise_tex2.noise_scale = 1.2
    noise_tex2.noise_depth = 6
    displace2.texture = noise_tex2
    displace2.strength = 1.0
    displace2.texture_coords = 'GLOBAL'
    bpy.ops.object.modifier_apply(modifier="Displace")

    # Dimmer, more diffuse material
    dim_color = tuple(c * 0.6 for c in emission_color)
    mat_outer = create_nebula_material("NebulaMat_Outer", dim_color, density=5.0)
    outer.data.materials.append(mat_outer)

    # === BRIGHT CORE (small, intense) ===
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2,
        radius=0.8,
        location=(-0.1, 0.1, 0)
    )
    core = bpy.context.active_object
    core.name = "Nebula_Core"

    bpy.ops.object.modifier_add(type='DISPLACE')
    displace3 = core.modifiers["Displace"]
    noise_tex3 = bpy.data.textures.new("CoreDisplace", type='CLOUDS')
    noise_tex3.noise_scale = 0.5
    displace3.texture = noise_tex3
    displace3.strength = 0.3
    bpy.ops.object.modifier_apply(modifier="Displace")

    # Bright core material
    bright_color = tuple(min(1.0, c * 1.5) for c in emission_color)
    mat_core = create_nebula_material("NebulaMat_Core", bright_color, density=20.0, emission_strength=8.0)
    core.data.materials.append(mat_core)

    # === FILAMENT EXTENSIONS (elongated blobs) ===
    filament_positions = [
        ((1.5, 0.8, 0.3), (0.4, 0.2, 0.15), (0.3, 0.1, 0.5)),
        ((-1.2, -0.6, 0.5), (0.3, 0.15, 0.2), (-0.2, 0.4, 0.1)),
        ((0.2, 1.3, -0.4), (0.25, 0.35, 0.12), (0.5, 0.2, -0.3)),
        ((-0.8, 0.4, -1.0), (0.2, 0.18, 0.3), (-0.1, 0.6, 0.2)),
    ]

    for i, (pos, scale, rot) in enumerate(filament_positions):
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=2,
            radius=1.0,
            location=pos
        )
        filament = bpy.context.active_object
        filament.name = f"Nebula_Filament_{i}"
        filament.scale = scale
        filament.rotation_euler = rot

        # Apply scale before displacement
        bpy.ops.object.transform_apply(scale=True)

        bpy.ops.object.modifier_add(type='DISPLACE')
        disp = filament.modifiers["Displace"]
        tex = bpy.data.textures.new(f"FilamentDisplace_{i}", type='CLOUDS')
        tex.noise_scale = 0.4
        tex.noise_depth = 3
        disp.texture = tex
        disp.strength = 0.2
        bpy.ops.object.modifier_apply(modifier="Displace")

        # Filament material (varied intensity)
        intensity = 0.4 + (i * 0.15)
        fil_color = tuple(c * intensity for c in emission_color)
        mat_fil = create_nebula_material(f"NebulaMat_Fil_{i}", fil_color, density=8.0)
        filament.data.materials.append(mat_fil)

    # === EMBEDDED STARS ===
    add_stars(emission_color)

    return main_body


def create_nebula_material(name, emission_color, density=10.0, emission_strength=5.0):
    """
    Create a volumetric nebula material with procedural noise.
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    # Output
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (800, 0)

    # Principled Volume
    volume = nodes.new("ShaderNodeVolumePrincipled")
    volume.location = (500, 0)
    links.new(volume.outputs["Volume"], output.inputs["Volume"])

    # Texture coordinates
    tex_coord = nodes.new("ShaderNodeTexCoord")
    tex_coord.location = (-800, 0)

    # Mapping with slight rotation for variation
    mapping = nodes.new("ShaderNodeMapping")
    mapping.location = (-600, 0)
    mapping.inputs["Scale"].default_value = (2.0, 2.0, 2.0)
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    # === NOISE LAYERS FOR FILAMENTOUS STRUCTURE ===

    # Primary noise (large structure)
    noise1 = nodes.new("ShaderNodeTexNoise")
    noise1.location = (-400, 200)
    noise1.noise_dimensions = '3D'
    noise1.inputs["Scale"].default_value = 1.5
    noise1.inputs["Detail"].default_value = 10.0
    noise1.inputs["Roughness"].default_value = 0.65
    noise1.inputs["Distortion"].default_value = 2.5  # Heavy distortion = filaments
    links.new(mapping.outputs["Vector"], noise1.inputs["Vector"])

    # Secondary noise (curl-like wisps)
    noise2 = nodes.new("ShaderNodeTexNoise")
    noise2.location = (-400, -100)
    noise2.noise_dimensions = '3D'
    noise2.inputs["Scale"].default_value = 3.0
    noise2.inputs["Detail"].default_value = 8.0
    noise2.inputs["Roughness"].default_value = 0.7
    noise2.inputs["Distortion"].default_value = 1.8
    links.new(mapping.outputs["Vector"], noise2.inputs["Vector"])

    # Tertiary noise (fine detail)
    noise3 = nodes.new("ShaderNodeTexNoise")
    noise3.location = (-400, -400)
    noise3.noise_dimensions = '3D'
    noise3.inputs["Scale"].default_value = 6.0
    noise3.inputs["Detail"].default_value = 12.0
    noise3.inputs["Roughness"].default_value = 0.8
    noise3.inputs["Distortion"].default_value = 0.5
    links.new(mapping.outputs["Vector"], noise3.inputs["Vector"])

    # Combine noises
    mix1 = nodes.new("ShaderNodeMixRGB")
    mix1.location = (-200, 100)
    mix1.blend_type = 'MULTIPLY'
    mix1.inputs["Fac"].default_value = 0.6
    links.new(noise1.outputs["Fac"], mix1.inputs["Color1"])
    links.new(noise2.outputs["Fac"], mix1.inputs["Color2"])

    mix2 = nodes.new("ShaderNodeMixRGB")
    mix2.location = (0, 100)
    mix2.blend_type = 'OVERLAY'
    mix2.inputs["Fac"].default_value = 0.3
    links.new(mix1.outputs["Color"], mix2.inputs["Color1"])
    links.new(noise3.outputs["Fac"], mix2.inputs["Color2"])

    # === SPHERICAL FALLOFF (soft edges) ===
    geometry = nodes.new("ShaderNodeNewGeometry")
    geometry.location = (-600, -600)

    vec_length = nodes.new("ShaderNodeVectorMath")
    vec_length.location = (-400, -600)
    vec_length.operation = 'LENGTH'
    links.new(geometry.outputs["Position"], vec_length.inputs[0])

    # Normalize and invert
    divide = nodes.new("ShaderNodeMath")
    divide.location = (-200, -600)
    divide.operation = 'DIVIDE'
    divide.inputs[1].default_value = 1.0  # Normalized radius
    links.new(vec_length.outputs["Value"], divide.inputs[0])

    subtract = nodes.new("ShaderNodeMath")
    subtract.location = (0, -600)
    subtract.operation = 'SUBTRACT'
    subtract.inputs[0].default_value = 1.0
    links.new(divide.outputs["Value"], subtract.inputs[1])

    # Smooth falloff (softer than squared)
    smooth = nodes.new("ShaderNodeMath")
    smooth.location = (100, -600)
    smooth.operation = 'SMOOTH_MIN'
    smooth.inputs[1].default_value = 0.0
    smooth.inputs[2].default_value = 0.3
    links.new(subtract.outputs["Value"], smooth.inputs[0])

    clamp = nodes.new("ShaderNodeClamp")
    clamp.location = (200, -600)
    links.new(smooth.outputs["Value"], clamp.inputs["Value"])

    # === FINAL DENSITY ===
    density_mult = nodes.new("ShaderNodeMath")
    density_mult.location = (200, 0)
    density_mult.operation = 'MULTIPLY'
    links.new(mix2.outputs["Color"], density_mult.inputs[0])
    links.new(clamp.outputs["Result"], density_mult.inputs[1])

    density_scale = nodes.new("ShaderNodeMath")
    density_scale.location = (350, 0)
    density_scale.operation = 'MULTIPLY'
    density_scale.inputs[1].default_value = density
    links.new(density_mult.outputs["Value"], density_scale.inputs[0])
    links.new(density_scale.outputs["Value"], volume.inputs["Density"])

    # === EMISSION ===
    # Color ramp for emission variation
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.location = (200, -200)
    ramp.color_ramp.elements[0].position = 0.3
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 0.7
    ramp.color_ramp.elements[1].color = (*emission_color, 1)
    links.new(mix2.outputs["Color"], ramp.inputs["Fac"])

    # Apply falloff to emission
    emission_mult = nodes.new("ShaderNodeMixRGB")
    emission_mult.location = (350, -200)
    emission_mult.blend_type = 'MULTIPLY'
    links.new(clamp.outputs["Result"], emission_mult.inputs["Fac"])
    links.new(ramp.outputs["Color"], emission_mult.inputs["Color1"])
    emission_mult.inputs["Color2"].default_value = (1, 1, 1, 1)

    links.new(emission_mult.outputs["Color"], volume.inputs["Emission Color"])
    volume.inputs["Emission Strength"].default_value = emission_strength
    volume.inputs["Anisotropy"].default_value = 0.2

    # Base absorption color (darker version of emission)
    dark_color = tuple(c * 0.3 for c in emission_color)
    volume.inputs["Color"].default_value = (*dark_color, 1)

    return mat


def add_stars(base_color):
    """Add embedded stars with color variation."""
    import random
    random.seed(42)

    scene = bpy.context.scene

    for i in range(15):
        # Random position weighted toward center
        r = random.uniform(0.2, 1.8) ** 1.5  # Bias toward center
        theta = random.uniform(0, math.pi * 2)
        phi = random.uniform(0, math.pi)
        x = r * math.sin(phi) * math.cos(theta)
        y = r * math.sin(phi) * math.sin(theta)
        z = r * math.cos(phi)

        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=random.uniform(0.015, 0.05),
            segments=8,
            ring_count=4,
            location=(x, y, z)
        )
        star = bpy.context.active_object
        star.name = f"Star_{i}"

        # Emissive material with color variation
        mat = bpy.data.materials.new(f"StarMat_{i}")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")

        # Vary color from white to tinted
        tint = random.uniform(0, 0.4)
        star_color = (
            1.0 - tint * (1 - base_color[0]),
            1.0 - tint * (1 - base_color[1]),
            1.0 - tint * (1 - base_color[2]),
            1
        )
        bsdf.inputs["Emission Color"].default_value = star_color
        bsdf.inputs["Emission Strength"].default_value = random.uniform(30, 80)

        star.data.materials.append(mat)


def setup_camera():
    """Setup orthographic camera for billboard render."""
    scene = bpy.context.scene

    cam_data = bpy.data.cameras.new("BillboardCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 6.0  # Capture full nebula with margins

    cam = bpy.data.objects.new("BillboardCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Front view
    cam.location = (0, -8, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)

    return cam


def setup_lighting():
    """Minimal lighting - nebula is self-illuminated."""
    scene = bpy.context.scene

    # Subtle rim light for depth
    rim_data = bpy.data.lights.new("RimLight", type='AREA')
    rim_data.energy = 30
    rim_data.size = 5
    rim_data.color = (0.9, 0.95, 1.0)
    rim = bpy.data.objects.new("RimLight", rim_data)
    rim.location = (0, 5, 2)
    rim.rotation_euler = (math.radians(-160), 0, 0)
    scene.collection.objects.link(rim)


def configure_render(resolution):
    """Configure Cycles for high-quality volume rendering."""
    scene = bpy.context.scene

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 256
    scene.cycles.use_denoising = True

    # Volume quality
    scene.cycles.volume_step_rate = 0.1  # High quality
    scene.cycles.volume_max_steps = 2048

    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100

    # Transparent background
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'


def render_nebula(output_dir, name, emission_color):
    """Render a nebula variant."""
    cleanup()

    create_filamentous_nebula(emission_color)
    setup_camera()
    setup_lighting()
    configure_render(RESOLUTION)

    filepath = os.path.join(output_dir, f"nebula_{name}.png")
    bpy.context.scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED: {filepath}")
    return filepath


def main():
    args = parse_args()
    output_dir = args.get("output", OUTPUT_DIR)
    os.makedirs(output_dir, exist_ok=True)

    try:
        rendered_files = []

        for name, color in TOPIC_COLORS.items():
            print(f"Rendering {name} variant...")
            filepath = render_nebula(output_dir, name, color)
            rendered_files.append(f"nebula_{name}.png")

        info = {
            "status": "success",
            "output_dir": output_dir,
            "resolution": RESOLUTION,
            "files": rendered_files
        }
        print(f"ASSET_INFO: {json.dumps(info)}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
