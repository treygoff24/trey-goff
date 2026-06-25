'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.08;
    a *= 0.48;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.045;
  float veil = fbm(vec2(p.x * 1.15 - t, p.y * 2.5 + t * 0.7));
  float ribbon = smoothstep(0.50, 0.86, veil + sin((p.x * 1.8 + p.y * 2.2 - t * 3.0)) * 0.18);
  float glow = smoothstep(0.90, 0.18, distance(uv, vec2(0.76, 0.14))) * 0.12;
  float lower = smoothstep(0.95, 0.12, distance(uv, vec2(0.78, 0.86))) * 0.11;
  float vignette = smoothstep(0.95, 0.25, distance(uv, vec2(0.5, 0.45)));

  vec3 ground = vec3(0.004, 0.016, 0.012);
  vec3 surface = vec3(0.012, 0.060, 0.040);
  vec3 accent = vec3(0.435, 0.839, 0.604);
  vec3 hover = vec3(0.592, 0.910, 0.733);

  vec3 color = mix(ground, surface, uv.y * 0.21 + glow * 0.7);
  color += accent * ribbon * 0.06;
  color += hover * glow * 0.08;
  color += accent * lower * 0.05;
  color *= 0.55 + vignette * 0.34;

  gl_FragColor = vec4(color, 1.0);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  if (!vertex || !fragment) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  return program
}

export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let frame = 0
    let start = performance.now()
    let gl: WebGLRenderingContext | null = null
    let program: WebGLProgram | null = null
    let buffer: WebGLBuffer | null = null
    let positionLocation = -1
    let resolutionLocation: WebGLUniformLocation | null = null
    let timeLocation: WebGLUniformLocation | null = null
    let lost = false

    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    const draw = (time: number) => {
      if (!gl || !program || lost) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      gl.viewport(0, 0, width, height)
      gl.useProgram(program)
      gl.uniform2f(resolutionLocation, width, height)
      gl.uniform1f(timeLocation, reducedMotion ? 0 : (time - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const tick = (time: number) => {
      draw(time)
      if (!reducedMotion && document.visibilityState === 'visible') {
        frame = requestAnimationFrame(tick)
      }
    }

    const setup = () => {
      stop()
      start = performance.now()
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false })
      if (!gl) return

      program = createProgram(gl)
      if (!program) return

      buffer = gl.createBuffer()
      if (!buffer) return

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      )

      positionLocation = gl.getAttribLocation(program, 'a_position')
      resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
      timeLocation = gl.getUniformLocation(program, 'u_time')

      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      tick(performance.now())
    }

    const handleVisibility = () => {
      stop()
      if (document.visibilityState === 'visible') tick(performance.now())
    }

    const handleLost = (event: Event) => {
      event.preventDefault()
      lost = true
      stop()
    }

    const handleRestored = () => {
      lost = false
      setup()
    }

    setup()
    document.addEventListener('visibilitychange', handleVisibility)
    canvas.addEventListener('webglcontextlost', handleLost)
    canvas.addEventListener('webglcontextrestored', handleRestored)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
      canvas.removeEventListener('webglcontextlost', handleLost)
      canvas.removeEventListener('webglcontextrestored', handleRestored)
      if (gl && buffer) gl.deleteBuffer(buffer)
      if (gl && program) gl.deleteProgram(program)
    }
  }, [reducedMotion])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#010403]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(58%_56%_at_82%_24%,rgba(54,181,124,0.09),transparent_66%),radial-gradient(70%_70%_at_73%_86%,rgba(111,214,154,0.055),transparent_70%),linear-gradient(90deg,#010403_0%,#030d09_52%,#04130c_100%)]" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-[0.52] sm:opacity-[0.6]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(1,7,5,0.36)_60%,rgba(1,5,4,0.9)_100%)]" />
    </div>
  )
}
