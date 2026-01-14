"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger } from "../DoorTrigger";
import { HolographicScreen, TechFloorGrid, AmbientParticles, GlowRing } from "../effects";
import type { RoomId } from "@/lib/interactive/types";
import type { ProjectsManifest, ProjectManifestEntry } from "@/lib/interactive/manifest-types";
import type { OverlayContent } from "../ContentOverlay";

// =============================================================================
// Types
// =============================================================================

interface ProjectsRoomProps {
	/** Show debug visualizations */
	debug?: boolean;
	/** Callback when door is activated */
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
	/** Callback when content is selected for overlay */
	onContentSelect?: (content: OverlayContent) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ROOM_WIDTH = 22;
const ROOM_DEPTH = 18;
const ROOM_HEIGHT = 7;

// Status colors for project pedestals
const STATUS_COLORS: Record<string, string> = {
	active: "#48bb78",
	shipped: "#4299e1",
	"on-hold": "#ed8936",
	archived: "#718096",
	idea: "#9f7aea",
};

// Type icons/colors
const TYPE_COLORS: Record<string, string> = {
	software: "#7C5CFF",
	policy: "#FFB86B",
	professional: "#4299e1",
	experiment: "#48bb78",
};

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Museum walls with subtle emissive accent lines.
 */
function Walls() {
	return (
		<group>
			{/* Back wall */}
			<mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#0a0a15" roughness={0.9} metalness={0.3} />
			</mesh>

			{/* Front wall (with door to main hall) */}
			<mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#0a0a15" roughness={0.9} metalness={0.3} />
			</mesh>

			{/* Left wall */}
			<mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#0a0a15" roughness={0.9} metalness={0.3} />
			</mesh>

			{/* Right wall */}
			<mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#0a0a15" roughness={0.9} metalness={0.3} />
			</mesh>

			{/* Accent trim lines on walls */}
			{[-ROOM_DEPTH / 2 + 0.16, ROOM_DEPTH / 2 - 0.16].map((z, i) => (
				<mesh key={i} position={[0, 0.1, z]}>
					<boxGeometry args={[ROOM_WIDTH - 0.6, 0.02, 0.02]} />
					<meshBasicMaterial color={THREE_COLORS.accent} />
				</mesh>
			))}
		</group>
	);
}

/**
 * Ceiling with recessed lighting panels.
 */
function Ceiling() {
	return (
		<group>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
				<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
				<meshStandardMaterial color="#050510" roughness={0.95} metalness={0.1} />
			</mesh>

			{/* Recessed light panels */}
			{[-6, 0, 6].map((x, i) => (
				<mesh key={i} position={[x, ROOM_HEIGHT - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<planeGeometry args={[2, ROOM_DEPTH - 4]} />
					<meshBasicMaterial color="#1a1a2a" />
				</mesh>
			))}
		</group>
	);
}

/**
 * Project exhibit pedestal with holographic terminal screen.
 */
function ProjectPedestal({
	project,
	position,
	isHovered,
	onClick,
	onPointerEnter,
	onPointerLeave,
}: {
	project: ProjectManifestEntry;
	position: [number, number, number];
	isHovered: boolean;
	onClick: () => void;
	onPointerEnter: () => void;
	onPointerLeave: () => void;
}) {
	const screenRef = useRef<THREE.Group>(null);
	const glowRef = useRef<THREE.PointLight>(null);

	useFrame((state) => {
		if (!screenRef.current) return;

		// Floating effect
		const float = Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.02;
		screenRef.current.position.y = 1.6 + float;

		// Pulse glow on hover
		if (glowRef.current) {
			const targetIntensity = isHovered ? 1.2 : 0.4;
			glowRef.current.intensity += (targetIntensity - glowRef.current.intensity) * 0.1;
		}
	});

	const statusColor = STATUS_COLORS[project.status] ?? "#718096";
	const typeColor = TYPE_COLORS[project.type] ?? "#7C5CFF";

	return (
		<group position={position}>
			{/* Pedestal base - darker, more refined */}
			<mesh position={[0, 0.4, 0]} castShadow>
				<cylinderGeometry args={[0.5, 0.7, 0.8, 16]} />
				<meshStandardMaterial
					color="#151520"
					roughness={0.3}
					metalness={0.7}
				/>
			</mesh>

			{/* Pedestal column - sleeker */}
			<mesh position={[0, 1, 0]} castShadow>
				<cylinderGeometry args={[0.1, 0.12, 0.8, 16]} />
				<meshStandardMaterial
					color="#252535"
					roughness={0.2}
					metalness={0.8}
				/>
			</mesh>

			{/* Screen backing (for interaction) */}
			<group
				ref={screenRef}
				position={[0, 1.6, 0]}
				onClick={(e) => {
					e.stopPropagation();
					onClick();
				}}
				onPointerEnter={(e) => {
					e.stopPropagation();
					onPointerEnter();
					document.body.style.cursor = "pointer";
				}}
				onPointerLeave={(e) => {
					e.stopPropagation();
					onPointerLeave();
					document.body.style.cursor = "auto";
				}}
			>
				{/* Invisible interaction mesh */}
				<mesh userData={{ type: "project", project }}>
					<boxGeometry args={[1.3, 0.9, 0.15]} />
					<meshBasicMaterial visible={false} />
				</mesh>

				{/* Holographic screen effect */}
				<group position={[0, 0, 0.06]}>
					<HolographicScreen
						color={typeColor}
						intensity={0.8}
						width={1.2}
						height={0.8}
						isActive={isHovered}
					/>
				</group>

				{/* Screen frame */}
				<mesh position={[0, 0, -0.02]}>
					<boxGeometry args={[1.3, 0.9, 0.04]} />
					<meshStandardMaterial
						color="#0a0a12"
						roughness={0.2}
						metalness={0.9}
					/>
				</mesh>
			</group>

			{/* Status indicator - pulsing orb */}
			<mesh position={[0, 2.15, 0]}>
				<sphereGeometry args={[0.06, 16, 16]} />
				<meshStandardMaterial
					color={statusColor}
					emissive={statusColor}
					emissiveIntensity={1.2}
				/>
			</mesh>

			{/* Glow light */}
			<pointLight
				ref={glowRef}
				position={[0, 1.6, 0.6]}
				intensity={0.4}
				color={typeColor}
				distance={4}
				decay={2}
			/>

			{/* Animated glow ring on floor */}
			<GlowRing
				innerRadius={0.85}
				outerRadius={1.05}
				color={typeColor}
				intensity={0.6}
				isActive={isHovered}
			/>
		</group>
	);
}

/**
 * Grid of project exhibits.
 */
function ProjectExhibits({
	projects,
	onProjectSelect,
}: {
	projects: ProjectManifestEntry[];
	onProjectSelect?: (project: ProjectManifestEntry) => void;
}) {
	const [hoveredProject, setHoveredProject] = useState<string | null>(null);

	const pedestalPositions = useMemo(() => {
		const positions: Array<{ project: ProjectManifestEntry; position: [number, number, number] }> = [];
		const cols = Math.min(projects.length, 3);
		const spacing = 5;

		projects.forEach((project, i) => {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const x = (col - (cols - 1) / 2) * spacing;
			const z = -2 + row * spacing;
			positions.push({ project, position: [x, 0, z] });
		});

		return positions;
	}, [projects]);

	useEffect(() => {
		return () => {
			document.body.style.cursor = "auto";
		};
	}, []);

	return (
		<group>
			{pedestalPositions.map(({ project, position }) => (
				<ProjectPedestal
					key={project.id}
					project={project}
					position={position}
					isHovered={hoveredProject === project.id}
					onClick={() => onProjectSelect?.(project)}
					onPointerEnter={() => setHoveredProject(project.id)}
					onPointerLeave={() => setHoveredProject(null)}
				/>
			))}
		</group>
	);
}

/**
 * Enhanced museum decor with dramatic spotlights.
 */
function MuseumDecor() {
	return (
		<group>
			{/* Track lighting rails */}
			{[-6, 0, 6].map((x, i) => (
				<group key={i}>
					<mesh position={[x, ROOM_HEIGHT - 0.3, 0]}>
						<boxGeometry args={[0.08, 0.08, ROOM_DEPTH - 2]} />
						<meshStandardMaterial color="#1a1a25" roughness={0.3} metalness={0.8} />
					</mesh>

					{/* Spotlights on track */}
					{[-4, 0, 4].map((z, j) => (
						<group key={j} position={[x, ROOM_HEIGHT - 0.5, z]}>
							<mesh>
								<cylinderGeometry args={[0.08, 0.12, 0.25, 8]} />
								<meshStandardMaterial color="#0a0a10" roughness={0.2} metalness={0.9} />
							</mesh>
							<spotLight
								position={[0, -0.1, 0]}
								angle={0.5}
								penumbra={0.8}
								intensity={0.8}
								color="#ffffff"
								distance={10}
								decay={2}
								castShadow
								shadow-mapSize-width={512}
								shadow-mapSize-height={512}
							/>
						</group>
					))}
				</group>
			))}
		</group>
	);
}

// =============================================================================
// Collision Bodies
// =============================================================================

function ProjectsColliders() {
	const wallThickness = 0.5;
	const wallHeight = ROOM_HEIGHT;

	return (
		<>
			{/* Floor */}
			<RigidBody type="fixed" position={[0, -0.25, 0]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, 0.25, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Back wall */}
			<RigidBody type="fixed" position={[0, wallHeight / 2, -ROOM_DEPTH / 2 - wallThickness / 2]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>

			{/* Front wall */}
			<RigidBody type="fixed" position={[0, wallHeight / 2, ROOM_DEPTH / 2 + wallThickness / 2]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>

			{/* Left wall */}
			<RigidBody type="fixed" position={[-ROOM_WIDTH / 2 - wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Right wall */}
			<RigidBody type="fixed" position={[ROOM_WIDTH / 2 + wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>
		</>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function ProjectsRoom({ debug = false, onDoorActivate, onContentSelect }: ProjectsRoomProps) {
	const [projects, setProjects] = useState<ProjectManifestEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();

		async function loadProjects() {
			try {
				const response = await fetch("/manifests/projects.manifest.json", {
					signal: controller.signal,
				});
				const manifest: ProjectsManifest = await response.json();
				setProjects(manifest.entries);
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") return;
				console.error("[ProjectsRoom] Failed to load projects manifest:", error);
			} finally {
				setLoading(false);
			}
		}

		loadProjects();
		return () => controller.abort();
	}, []);

	const handleProjectSelect = useCallback((project: ProjectManifestEntry) => {
		if (!onContentSelect) return;

		const statusLabels: Record<string, string> = {
			active: "🟢 Active",
			shipped: "🚀 Shipped",
			"on-hold": "⏸️ On Hold",
			archived: "📦 Archived",
			idea: "💡 Idea",
		};

		const typeLabels: Record<string, string> = {
			software: "Software",
			policy: "Policy",
			professional: "Professional",
			experiment: "Experiment",
		};

		const content: OverlayContent = {
			type: "project",
			title: project.title,
			description: project.summary,
			image: project.images[0],
			readMoreUrl: project.links[0]?.url ?? `/projects#${project.id}`,
			meta: {
				Status: statusLabels[project.status] ?? project.status,
				Type: typeLabels[project.type] ?? project.type,
			},
			tags: project.tags,
		};

		onContentSelect(content);
	}, [onContentSelect]);

	return (
		<group name="room-projects">
			{/* Collision bodies */}
			<ProjectsColliders />

			{/* Tech floor with grid pattern */}
			<TechFloorGrid
				width={ROOM_WIDTH}
				depth={ROOM_DEPTH}
				baseColor="#080810"
				gridColor={THREE_COLORS.accent}
				gridIntensity={0.12}
				gridSize={2.0}
			/>

			{/* Structure */}
			<Walls />
			<Ceiling />

			{/* Atmospheric particles */}
			<AmbientParticles
				count={50}
				bounds={[ROOM_WIDTH - 2, ROOM_HEIGHT - 1, ROOM_DEPTH - 2]}
				color={THREE_COLORS.accent}
				size={12}
				speed={0.8}
			/>

			{/* Museum decor */}
			<MuseumDecor />

			{/* Project exhibits */}
			{!loading && projects.length > 0 && (
				<ProjectExhibits
					projects={projects}
					onProjectSelect={handleProjectSelect}
				/>
			)}

			{/* Empty state */}
			{!loading && projects.length === 0 && (
				<mesh position={[0, 2, 0]}>
					<planeGeometry args={[4, 1]} />
					<meshBasicMaterial
						color={THREE_COLORS.accent}
						transparent
						opacity={0.3}
					/>
				</mesh>
			)}

			{/* Door to Main Hall */}
			<DoorTrigger
				position={[0, 2, ROOM_DEPTH / 2 - 1]}
				targetRoom="mainhall"
				spawnPosition={[0, 0, -10]}
				spawnRotation={0}
				onActivate={onDoorActivate}
				debug={debug}
				label="Main Hall"
				labelRotation={Math.PI}
			/>

			{/* Door frame - enhanced */}
			<group position={[0, 2, ROOM_DEPTH / 2]}>
				<mesh>
					<boxGeometry args={[3.5, 4.5, 0.3]} />
					<meshStandardMaterial
						color="#1a1520"
						roughness={0.3}
						metalness={0.7}
					/>
				</mesh>
				{/* Door frame accent */}
				<mesh position={[0, 0, 0.1]}>
					<boxGeometry args={[3.2, 4.2, 0.05]} />
					<meshStandardMaterial
						color={THREE_COLORS.warm}
						emissive={THREE_COLORS.warm}
						emissiveIntensity={0.15}
						roughness={0.4}
						metalness={0.6}
					/>
				</mesh>
				<mesh position={[0, 0, -0.1]}>
					<boxGeometry args={[2.5, 4, 0.2]} />
					<meshBasicMaterial color="#030308" />
				</mesh>
			</group>

			{/* Ambient lighting - subtle cool tone */}
			<ambientLight intensity={0.08} color="#8888bb" />

			{/* Main overhead lights - dramatic */}
			<pointLight
				position={[0, ROOM_HEIGHT - 1, 0]}
				intensity={0.3}
				color="#ffffff"
				distance={12}
				decay={2}
			/>

			{/* Accent rim lights */}
			<pointLight
				position={[-ROOM_WIDTH / 2 + 1, 2, 0]}
				intensity={0.15}
				color={THREE_COLORS.accent}
				distance={8}
				decay={2}
			/>
			<pointLight
				position={[ROOM_WIDTH / 2 - 1, 2, 0]}
				intensity={0.15}
				color={THREE_COLORS.accent}
				distance={8}
				decay={2}
			/>
		</group>
	);
}
