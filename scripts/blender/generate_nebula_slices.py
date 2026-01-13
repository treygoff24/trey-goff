#!/usr/bin/env python3
"""
Nebula Slice Generator for Floating Library
Renders volumetric nebula slices for sprite-stack volume impostors.

Run: blender -b --python generate_nebula_slices.py --python-exit-code 1 -- output=/path/to/output

Output:
- nebula_slice_00.png through nebula_slice_15.png (16 slices through volume)
- nebula_hero.png (perspective hero shot for reference)
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
OUTPUT_DIR = "/tmp/nebula"
SLICE_COUNT = 16  # Number of slices through the volume
SLICE_RESOLUTION = 512  # px per slice (will be square)
HERO_RESOLUTION = (1024, 1024)

# Nebula colors - deep space purples/blues with warm emission cores
NEBULA_BASE_COLOR = (0.15, 0.08, 0.25)  # Deep purple
NEBULA_EMISSION_COLOR = (0.4, 0.2, 0.6)  # Bright purple-pink
NEBULA_CORE_COLOR = (1.0, 0.6, 0.3)  # Warm orange core


# ============================================================
# ARGUMENT PARSING
# ============================================================
def parse_args():
    """Parse arguments after -- separator."""
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


# ============================================================
# CLEANUP
# ============================================================
def cleanup():
    """Remove all objects for clean generation."""
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Set up world with black background (transparent for compositing)
    world = bpy.data.worlds.new("NebulaWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0


# ============================================================
# NEBULA VOLUME CREATION
# ============================================================
def create_nebula_volume():
    """
    Create a volumetric nebula using procedural noise.
    Uses multiple nested volumes for layered density and color.
    """
    scene = bpy.context.scene

    # Create main nebula domain (sphere for organic falloff)
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

    # Clear default nodes
    nodes.clear()

    # Output node
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (600, 0)

    # Principled Volume shader
    volume = nodes.new("ShaderNodeVolumePrincipled")
    volume.location = (300, 0)
    links.new(volume.outputs["Volume"], output.inputs["Volume"])

    # Texture Coordinate for 3D noise
    tex_coord = nodes.new("ShaderNodeTexCoord")
    tex_coord.location = (-800, 0)

    # Mapping for animation/variation
    mapping = nodes.new("ShaderNodeMapping")
    mapping.location = (-600, 0)
    mapping.inputs["Scale"].default_value = (1.5, 1.5, 1.5)
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    # === PRIMARY NOISE (large-scale structure) ===
    noise1 = nodes.new("ShaderNodeTexNoise")
    noise1.location = (-400, 200)
    noise1.noise_dimensions = '3D'
    noise1.inputs["Scale"].default_value = 2.0
    noise1.inputs["Detail"].default_value = 8.0
    noise1.inputs["Roughness"].default_value = 0.6
    noise1.inputs["Distortion"].default_value = 1.5  # Creates filaments
    links.new(mapping.outputs["Vector"], noise1.inputs["Vector"])

    # === SECONDARY NOISE (fine detail / wisps) ===
    noise2 = nodes.new("ShaderNodeTexNoise")
    noise2.location = (-400, -100)
    noise2.noise_dimensions = '3D'
    noise2.inputs["Scale"].default_value = 5.0
    noise2.inputs["Detail"].default_value = 12.0
    noise2.inputs["Roughness"].default_value = 0.7
    noise2.inputs["Distortion"].default_value = 0.8
    links.new(mapping.outputs["Vector"], noise2.inputs["Vector"])

    # === CURL-LIKE DISTORTION (for filament structure) ===
    noise3 = nodes.new("ShaderNodeTexNoise")
    noise3.location = (-400, -400)
    noise3.noise_dimensions = '3D'
    noise3.inputs["Scale"].default_value = 1.0
    noise3.inputs["Detail"].default_value = 4.0
    noise3.inputs["Distortion"].default_value = 3.0  # Heavy distortion for curl effect
    links.new(mapping.outputs["Vector"], noise3.inputs["Vector"])

    # Mix noises for density
    mix1 = nodes.new("ShaderNodeMixRGB")
    mix1.location = (-200, 100)
    mix1.blend_type = 'MULTIPLY'
    mix1.inputs["Fac"].default_value = 0.7
    links.new(noise1.outputs["Fac"], mix1.inputs["Color1"])
    links.new(noise2.outputs["Fac"], mix1.inputs["Color2"])

    # Add curl influence
    mix2 = nodes.new("ShaderNodeMixRGB")
    mix2.location = (0, 100)
    mix2.blend_type = 'OVERLAY'
    mix2.inputs["Fac"].default_value = 0.4
    links.new(mix1.outputs["Color"], mix2.inputs["Color1"])
    links.new(noise3.outputs["Fac"], mix2.inputs["Color2"])

    # === SPHERICAL FALLOFF (organic edge) ===
    geometry = nodes.new("ShaderNodeNewGeometry")
    geometry.location = (-600, -600)

    # Distance from center (0-1 normalized)
    vec_length = nodes.new("ShaderNodeVectorMath")
    vec_length.location = (-400, -600)
    vec_length.operation = 'LENGTH'
    links.new(geometry.outputs["Position"], vec_length.inputs[0])

    # Normalize to sphere radius and invert (1 at center, 0 at edge)
    divide = nodes.new("ShaderNodeMath")
    divide.location = (-200, -600)
    divide.operation = 'DIVIDE'
    divide.inputs[1].default_value = 2.0  # sphere radius
    links.new(vec_length.outputs["Value"], divide.inputs[0])

    subtract = nodes.new("ShaderNodeMath")
    subtract.location = (0, -600)
    subtract.operation = 'SUBTRACT'
    subtract.inputs[0].default_value = 1.0
    links.new(divide.outputs["Value"], subtract.inputs[1])

    # Smooth falloff with power curve
    power = nodes.new("ShaderNodeMath")
    power.location = (100, -600)
    power.operation = 'POWER'
    power.inputs[1].default_value = 2.0  # Squared falloff
    power.use_clamp = True
    links.new(subtract.outputs["Value"], power.inputs[0])

    # === FINAL DENSITY ===
    density_mult = nodes.new("ShaderNodeMath")
    density_mult.location = (100, 0)
    density_mult.operation = 'MULTIPLY'
    links.new(mix2.outputs["Color"], density_mult.inputs[0])
    links.new(power.outputs["Value"], density_mult.inputs[1])

    # Scale density for volume shader
    density_scale = nodes.new("ShaderNodeMath")
    density_scale.location = (200, 0)
    density_scale.operation = 'MULTIPLY'
    density_scale.inputs[1].default_value = 15.0  # Density multiplier
    links.new(density_mult.outputs["Value"], density_scale.inputs[0])
    links.new(density_scale.outputs["Value"], volume.inputs["Density"])

    # === EMISSION (bright cores) ===
    # Use noise to create bright spots
    emission_ramp = nodes.new("ShaderNodeValToRGB")
    emission_ramp.location = (100, -200)
    emission_ramp.color_ramp.elements[0].position = 0.4
    emission_ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    emission_ramp.color_ramp.elements[1].position = 0.8
    emission_ramp.color_ramp.elements[1].color = (*NEBULA_EMISSION_COLOR, 1)
    links.new(mix2.outputs["Color"], emission_ramp.inputs["Fac"])

    # Apply falloff to emission too
    emission_final = nodes.new("ShaderNodeMixRGB")
    emission_final.location = (200, -200)
    emission_final.blend_type = 'MULTIPLY'
    links.new(power.outputs["Value"], emission_final.inputs["Fac"])
    links.new(emission_ramp.outputs["Color"], emission_final.inputs["Color1"])
    emission_final.inputs["Color2"].default_value = (1, 1, 1, 1)

    links.new(emission_final.outputs["Color"], volume.inputs["Emission Color"])

    # Emission strength
    volume.inputs["Emission Strength"].default_value = 3.0

    # Anisotropy for light scattering
    volume.inputs["Anisotropy"].default_value = 0.3

    # Base color (absorption)
    volume.inputs["Color"].default_value = (*NEBULA_BASE_COLOR, 1)

    # Apply material
    nebula.data.materials.append(mat)

    return nebula


def add_internal_stars():
    """Add small emissive spheres inside nebula as 'embedded stars'."""
    import random
    random.seed(42)  # Reproducible

    stars = []
    for i in range(12):
        # Random position inside sphere
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
        star.name = f"InternalStar_{i}"

        # Emissive material
        mat = bpy.data.materials.new(f"StarMat_{i}")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links

        bsdf = nodes.get("Principled BSDF")
        # Bright emission
        bsdf.inputs["Emission Color"].default_value = (
            random.uniform(0.8, 1.0),
            random.uniform(0.7, 1.0),
            random.uniform(0.9, 1.0),
            1
        )
        bsdf.inputs["Emission Strength"].default_value = random.uniform(20, 50)

        star.data.materials.append(mat)
        stars.append(star)

    return stars


# ============================================================
# CAMERA SETUP
# ============================================================
def setup_orthographic_camera(z_position, name="SliceCamera"):
    """Setup orthographic camera for slice rendering."""
    scene = bpy.context.scene

    # Remove existing camera if present
    if scene.camera:
        bpy.data.objects.remove(scene.camera, do_unlink=True)

    cam_data = bpy.data.cameras.new(name)
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 5.0  # Capture full nebula width

    cam = bpy.data.objects.new(name, cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Position looking down Z axis (for slice)
    cam.location = (0, 0, z_position + 5)  # Above the slice plane
    cam.rotation_euler = (0, 0, 0)  # Looking straight down

    return cam


def setup_perspective_camera(distance=6):
    """Setup perspective camera for hero shot."""
    scene = bpy.context.scene

    if scene.camera:
        bpy.data.objects.remove(scene.camera, do_unlink=True)

    cam_data = bpy.data.cameras.new("HeroCamera")
    cam_data.type = 'PERSP'
    cam_data.lens = 50

    cam = bpy.data.objects.new("HeroCamera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Position at angle
    cam.location = (distance * 0.7, -distance * 0.7, distance * 0.4)

    # Point at center
    direction = Vector((0, 0, 0)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    return cam


# ============================================================
# LIGHTING
# ============================================================
def setup_nebula_lighting():
    """Setup ambient lighting for nebula (mostly self-lit via emission)."""
    scene = bpy.context.scene

    # Key light (subtle, nebulae are mostly self-illuminated)
    key_data = bpy.data.lights.new("KeyLight", type='POINT')
    key_data.energy = 50
    key_data.color = (1.0, 0.95, 0.9)
    key = bpy.data.objects.new("KeyLight", key_data)
    key.location = (3, -3, 3)
    scene.collection.objects.link(key)

    # Fill (very subtle)
    fill_data = bpy.data.lights.new("FillLight", type='POINT')
    fill_data.energy = 20
    fill_data.color = (0.8, 0.85, 1.0)
    fill = bpy.data.objects.new("FillLight", fill_data)
    fill.location = (-3, 2, -1)
    scene.collection.objects.link(fill)


# ============================================================
# RENDERING
# ============================================================
def configure_render_settings(resolution, transparent=True):
    """Configure Cycles for volume rendering with transparency."""
    scene = bpy.context.scene

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'  # Use GPU if available
    scene.cycles.samples = 128  # Good balance for volumes
    scene.cycles.use_denoising = True

    # Volume settings
    scene.cycles.volume_step_rate = 0.25  # Higher quality
    scene.cycles.volume_max_steps = 1024

    scene.render.resolution_x = resolution[0] if isinstance(resolution, tuple) else resolution
    scene.render.resolution_y = resolution[1] if isinstance(resolution, tuple) else resolution
    scene.render.resolution_percentage = 100

    # Transparent background
    if transparent:
        scene.render.film_transparent = True

    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'


def render_slices(output_dir, nebula, slice_count=16):
    """Render orthographic slices through the nebula volume."""
    scene = bpy.context.scene

    # Nebula bounds
    z_min = -2.0
    z_max = 2.0
    z_step = (z_max - z_min) / (slice_count - 1)

    configure_render_settings(SLICE_RESOLUTION, transparent=True)

    # Create clipping planes for each slice
    for i in range(slice_count):
        z = z_min + (i * z_step)

        # Position camera for this slice
        setup_orthographic_camera(z)

        # Use camera clipping to isolate slice
        scene.camera.data.clip_start = 4.5  # Just above slice
        scene.camera.data.clip_end = 5.5    # Just below slice

        # Render
        filepath = os.path.join(output_dir, f"nebula_slice_{i:02d}.png")
        scene.render.filepath = filepath
        bpy.ops.render.render(write_still=True)
        print(f"SLICE_RENDERED: {filepath}")


def render_hero(output_dir):
    """Render a hero perspective shot of the nebula."""
    scene = bpy.context.scene

    configure_render_settings(HERO_RESOLUTION, transparent=True)
    scene.cycles.samples = 256  # Higher quality for hero

    setup_perspective_camera()

    filepath = os.path.join(output_dir, "nebula_hero.png")
    scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)
    print(f"HERO_RENDERED: {filepath}")


def render_front_view(output_dir):
    """Render a front orthographic view (useful as a billboard texture)."""
    scene = bpy.context.scene

    configure_render_settings((1024, 1024), transparent=True)
    scene.cycles.samples = 256

    # Setup camera looking at front
    cam_data = bpy.data.cameras.new("FrontCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 5.0

    if scene.camera:
        bpy.data.objects.remove(scene.camera, do_unlink=True)

    cam = bpy.data.objects.new("FrontCamera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    cam.location = (0, -6, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)

    filepath = os.path.join(output_dir, "nebula_front.png")
    scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)
    print(f"FRONT_RENDERED: {filepath}")


# ============================================================
# MAIN
# ============================================================
def main():
    args = parse_args()
    output_dir = args.get("output", OUTPUT_DIR)

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    try:
        print("Starting nebula generation...")

        # Clean scene
        cleanup()

        # Create nebula
        nebula = create_nebula_volume()
        print("Nebula volume created")

        # Add internal stars
        stars = add_internal_stars()
        print(f"Added {len(stars)} internal stars")

        # Setup lighting
        setup_nebula_lighting()

        # Render hero shot first (for quick preview)
        print("Rendering hero shot...")
        render_hero(output_dir)

        # Render front view (billboard texture)
        print("Rendering front view...")
        render_front_view(output_dir)

        # Render slices
        print(f"Rendering {SLICE_COUNT} slices...")
        render_slices(output_dir, nebula, SLICE_COUNT)

        # Output summary
        info = {
            "status": "success",
            "output_dir": output_dir,
            "slices": SLICE_COUNT,
            "slice_resolution": SLICE_RESOLUTION,
            "hero_resolution": HERO_RESOLUTION,
            "files": [
                "nebula_hero.png",
                "nebula_front.png",
                *[f"nebula_slice_{i:02d}.png" for i in range(SLICE_COUNT)]
            ]
        }
        print(f"ASSET_INFO: {json.dumps(info)}")

    except Exception as e:
        import traceback
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
