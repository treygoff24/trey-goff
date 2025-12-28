"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger } from "../DoorTrigger";
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
	active: "#48bb78",    // Green
	shipped: "#4299e1",   // Blue
	"on-hold": "#ed8936", // Orange
	archived: "#718096",  // Gray
	idea: "#9f7aea",      // Purple
};

// Type icons/colors
const TYPE_COLORS: Record<string, string> = {
	software: "#7C5CFF",     // Accent purple
	policy: "#FFB86B",       // Warm gold
	professional: "#4299e1", // Blue
	experiment: "#48bb78",   // Green
};

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Museum floor with polished appearance.
 */
function Floor() {
	return (
		<mesh
			rotation={[-Math.PI / 2, 0, 0]}
			position={[0, 0, 0]}
			receiveShadow
			name="ground"
		>
			<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
			<meshStandardMaterial
				color="#151520"
				roughness={0.4}
				metalness={0.3}
			/>
		</mesh>
	);
}

/**
 * Museum walls.
 */
function Walls() {
	return (
		<group>
			{/* Back wall */}
			<mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Front wall (with door to main hall) */}
			<mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Left wall */}
			<mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Right wall */}
			<mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>
		</group>
	);
}

/**
 * Ceiling with track lighting.
 */
function Ceiling() {
	return (
		<mesh
			rotation={[Math.PI / 2, 0, 0]}
			position={[0, ROOM_HEIGHT, 0]}
		>
			<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
			<meshStandardMaterial color="#0a0a15" roughness={0.9} metalness={0.1} />
		</mesh>
	);
}

/**
 * Project exhibit pedestal with terminal screen.
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
	const screenRef = useRef<THREE.Mesh>(null);
	const glowRef = useRef<THREE.PointLight>(null);

	// Subtle hover animation
	useFrame((state) => {
		if (!screenRef.current) return;

		// Floating effect
		const float = Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.02;
		screenRef.current.position.y = 1.6 + float;

		// Pulse glow on hover
		if (glowRef.current) {
			const targetIntensity = isHovered ? 0.8 : 0.3;
			glowRef.current.intensity += (targetIntensity - glowRef.current.intensity) * 0.1;
		}
	});

	const statusColor = STATUS_COLORS[project.status] ?? "#718096";
	const typeColor = TYPE_COLORS[project.type] ?? "#7C5CFF";

	return (
		<group position={position}>
			{/* Pedestal base */}
			<mesh position={[0, 0.4, 0]} castShadow>
				<cylinderGeometry args={[0.6, 0.8, 0.8, 8]} />
				<meshStandardMaterial
					color="#2a2a3a"
					roughness={0.4}
					metalness={0.6}
				/>
			</mesh>

			{/* Pedestal column */}
			<mesh position={[0, 1, 0]} castShadow>
				<cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
				<meshStandardMaterial
					color="#3a3a4a"
					roughness={0.3}
					metalness={0.7}
				/>
			</mesh>

			{/* Terminal screen */}
			<mesh
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
				userData={{ type: "project", project }}
			>
				<boxGeometry args={[1.2, 0.8, 0.1]} />
				<meshStandardMaterial
					color="#0f0f1a"
					roughness={0.2}
					metalness={0.8}
					emissive={isHovered ? typeColor : "#1a1a2e"}
					emissiveIntensity={isHovered ? 0.5 : 0.2}
				/>
			</mesh>

			{/* Screen content area */}
			<mesh position={[0, 1.6, 0.06]}>
				<planeGeometry args={[1, 0.6]} />
				<meshBasicMaterial
					color={typeColor}
					transparent
					opacity={0.3}
				/>
			</mesh>

			{/* Status indicator */}
			<mesh position={[0, 2.1, 0]}>
				<sphereGeometry args={[0.08, 16, 16]} />
				<meshStandardMaterial
					color={statusColor}
					emissive={statusColor}
					emissiveIntensity={0.8}
				/>
			</mesh>

			{/* Glow light */}
			<pointLight
				ref={glowRef}
				position={[0, 1.6, 0.5]}
				intensity={0.3}
				color={typeColor}
				distance={3}
				decay={2}
			/>

			{/* Accent ring on floor */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
				<ringGeometry args={[0.9, 1.1, 32]} />
				<meshBasicMaterial
					color={typeColor}
					transparent
					opacity={isHovered ? 0.4 : 0.15}
					side={THREE.DoubleSide}
				/>
			</mesh>
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

	// Calculate pedestal positions in a grid
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

	// Cleanup cursor on unmount
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
 * Decorative museum elements.
 */
function MuseumDecor() {
	return (
		<group>
			{/* Track lighting rails */}
			{[-6, 0, 6].map((x, i) => (
				<group key={i}>
					<mesh position={[x, ROOM_HEIGHT - 0.3, 0]}>
						<boxGeometry args={[0.1, 0.1, ROOM_DEPTH - 2]} />
						<meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.7} />
					</mesh>

					{/* Spotlights on track */}
					{[-4, 0, 4].map((z, j) => (
						<group key={j} position={[x, ROOM_HEIGHT - 0.5, z]}>
							<mesh>
								<cylinderGeometry args={[0.1, 0.15, 0.3, 8]} />
								<meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
							</mesh>
							<spotLight
								position={[0, 0, 0]}
								angle={0.4}
								penumbra={0.6}
								intensity={0.5}
								color="#ffffff"
								distance={8}
								decay={2}
								target-position={[x, 0, z]}
							/>
						</group>
					))}
				</group>
			))}
		</group>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ProjectsRoom - Museum-style display of projects.
 */
export function ProjectsRoom({ debug = false, onDoorActivate, onContentSelect }: ProjectsRoomProps) {
	const [projects, setProjects] = useState<ProjectManifestEntry[]>([]);
	const [loading, setLoading] = useState(true);

	// Load projects manifest with abort cleanup
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

	// Convert project to overlay content
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
			{/* Structure */}
			<Floor />
			<Walls />
			<Ceiling />

			{/* Museum decor */}
			<MuseumDecor />

			{/* Project exhibits */}
			{!loading && projects.length > 0 && (
				<ProjectExhibits
					projects={projects}
					onProjectSelect={handleProjectSelect}
				/>
			)}

			{/* Empty state message area */}
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
			/>

			{/* Door frame */}
			<group position={[0, 2, ROOM_DEPTH / 2]}>
				<mesh>
					<boxGeometry args={[3.5, 4.5, 0.3]} />
					<meshStandardMaterial
						color={THREE_COLORS.warm}
						roughness={0.4}
						metalness={0.6}
						emissive={THREE_COLORS.warm}
						emissiveIntensity={0.1}
					/>
				</mesh>
				<mesh position={[0, 0, -0.1]}>
					<boxGeometry args={[2.5, 4, 0.2]} />
					<meshBasicMaterial color="#050510" />
				</mesh>
			</group>

			{/* Ambient lighting */}
			<ambientLight intensity={0.1} color="#aaaacc" />

			{/* Main overhead light */}
			<pointLight
				position={[0, ROOM_HEIGHT - 1, 0]}
				intensity={0.4}
				color="#ffffff"
				distance={15}
				decay={2}
				castShadow
			/>
		</group>
	);
}
