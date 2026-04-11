'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const vertexSource = [
  'attribute vec2 a_pos;',
  'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }',
].join('\n')

const fragmentSource = [
  'precision highp float;',
  'uniform float u_time;',
  'uniform vec2 u_res;',
  'uniform float u_foldSpeed;',
  'uniform float u_layerCount;',
  'uniform vec2 u_mouse;',
  '',
  'float hash11(float p) {',
  '  p = fract(p * 0.1031);',
  '  p *= p + 33.33;',
  '  p *= p + p;',
  '  return fract(p);',
  '}',
  '',
  'float hash21(vec2 p) {',
  '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
  '  p3 += dot(p3, p3.yzx + 33.33);',
  '  return fract((p3.x + p3.y) * p3.z);',
  '}',
  '',
  'vec2 hash22(vec2 p) {',
  '  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));',
  '  p3 += dot(p3, p3.yzx + 33.33);',
  '  return fract((p3.xx + p3.yz) * p3.zy);',
  '}',
  '',
  'float vnoise(vec2 p) {',
  '  vec2 i = floor(p);',
  '  vec2 f = fract(p);',
  '  f = f * f * (3.0 - 2.0 * f);',
  '  float a = hash21(i);',
  '  float b = hash21(i + vec2(1.0, 0.0));',
  '  float c = hash21(i + vec2(0.0, 1.0));',
  '  float d = hash21(i + vec2(1.0, 1.0));',
  '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
  '}',
  '',
  'float fbm(vec2 p) {',
  '  float v = 0.0;',
  '  float a = 0.5;',
  '  vec2 shift = vec2(100.0);',
  '  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));',
  '  for (int i = 0; i < 5; i++) {',
  '    v += a * vnoise(p);',
  '    p = rot * p * 2.0 + shift;',
  '    a *= 0.5;',
  '  }',
  '  return v;',
  '}',
  '',
  'vec2 tectonicWarp(vec2 uv, float t) {',
  '  float slow = t * 0.15;',
  '  float warpX = fbm(uv * 1.5 + vec2(slow * 0.7, slow * 0.3)) - 0.5;',
  '  float warpY = fbm(uv * 1.5 + vec2(slow * 0.5 + 50.0, slow * 0.8 + 30.0)) - 0.5;',
  '  float compress = sin(uv.x * 2.0 + slow * 0.4) * 0.08;',
  '  float shear = sin(uv.y * 3.0 + slow * 0.6) * 0.06;',
  '  return vec2(',
  '    uv.x + warpX * 0.25 + shear,',
  '    uv.y + warpY * 0.18 + compress',
  '  );',
  '}',
  '',
  'float layerBoundary(float x, float baseY, float idx, float t) {',
  '  float h1 = hash11(idx * 7.13);',
  '  float h2 = hash11(idx * 13.37);',
  '  float h3 = hash11(idx * 23.71);',
  '  float freq1 = 1.5 + h1 * 2.5;',
  '  float freq2 = 3.0 + h2 * 3.0;',
  '  float amp1 = 0.04 + h1 * 0.06;',
  '  float amp2 = 0.015 + h2 * 0.025;',
  '  float phase1 = t * (0.1 + h3 * 0.15);',
  '  float phase2 = t * (0.08 + h1 * 0.12);',
  '  float fold = amp1 * sin(x * freq1 + phase1 + h2 * 6.28);',
  '  fold += amp2 * sin(x * freq2 + phase2 + h3 * 6.28);',
  '  fold += 0.02 * vnoise(vec2(x * 4.0 + h1 * 100.0, t * 0.2 + idx));',
  '  return baseY + fold;',
  '}',
  '',
  'vec3 stratumColor(float idx, float maxLayers) {',
  '  vec3 colors[7];',
  '  colors[0] = vec3(14.0, 22.0, 38.0) / 255.0;',
  '  colors[1] = vec3(20.0, 39.0, 66.0) / 255.0;',
  '  colors[2] = vec3(28.0, 56.0, 92.0) / 255.0;',
  '  colors[3] = vec3(42.0, 79.0, 122.0) / 255.0;',
  '  colors[4] = vec3(16.0, 30.0, 52.0) / 255.0;',
  '  colors[5] = vec3(58.0, 100.0, 148.0) / 255.0;',
  '  colors[6] = vec3(92.0, 134.0, 182.0) / 255.0;',
  '  float h = hash11(idx * 17.31 + 3.7);',
  '  int ci = int(mod(floor(h * 7.0), 7.0));',
  '  vec3 base;',
  '  if (ci == 0) base = colors[0];',
  '  else if (ci == 1) base = colors[1];',
  '  else if (ci == 2) base = colors[2];',
  '  else if (ci == 3) base = colors[3];',
  '  else if (ci == 4) base = colors[4];',
  '  else if (ci == 5) base = colors[5];',
  '  else base = colors[6];',
  '  float h2 = hash11(idx * 31.17);',
  '  base += (h2 - 0.5) * 0.045;',
  '  return base;',
  '}',
  '',
  'float grainTexture(vec2 uv, float layerIdx) {',
  '  float h = hash11(layerIdx * 41.93);',
  '  float intensity = 0.0;',
  '  float fiberAngle = h * 3.14 * 0.3;',
  '  float ca = cos(fiberAngle), sa = sin(fiberAngle);',
  '  vec2 rotUV = vec2(uv.x * ca - uv.y * sa, uv.x * sa + uv.y * ca);',
  '  float fiber1 = vnoise(vec2(rotUV.x * 120.0, rotUV.y * 18.0) + layerIdx * 30.0);',
  '  float fiber2 = vnoise(vec2(rotUV.x * 80.0, rotUV.y * 12.0) + layerIdx * 50.0 + 100.0);',
  '  intensity = fiber1 * 0.08 + fiber2 * 0.05;',
  '  float cross = vnoise(vec2(rotUV.x * 15.0, rotUV.y * 70.0) + layerIdx * 40.0);',
  '  intensity += cross * 0.03;',
  '  intensity += vnoise(uv * 50.0 + layerIdx * 25.0) * 0.025;',
  '  return intensity - 0.04;',
  '}',
  '',
  'float sparkle(vec2 uv, float t, float layerIdx) {',
  '  float h = hash11(layerIdx * 53.71);',
  '  if (h < 0.4) return 0.0;',
  '  float density = 60.0 + h * 80.0;',
  '  vec2 cell = floor(uv * density);',
  '  vec2 cellHash = hash22(cell + layerIdx * 7.0);',
  '  vec2 cellUV = fract(uv * density);',
  '  vec2 sparklePos = cellHash;',
  '  float dist = length(cellUV - sparklePos);',
  '  float phase = cellHash.x * 6.28 + cellHash.y * 3.14;',
  '  float twinkle = sin(t * (2.0 + cellHash.x * 4.0) + phase);',
  '  float threshold = 0.7 + twinkle * 0.25;',
  '  float sparkleVal = smoothstep(threshold, threshold + 0.05, cellHash.x * cellHash.y + 0.3);',
  '  sparkleVal *= smoothstep(0.06, 0.01, dist);',
  '  return sparkleVal * 0.4;',
  '}',
  '',
  'float faultDisplacement(vec2 uv, float t) {',
  '  float totalDisp = 0.0;',
  '  for (int i = 0; i < 3; i++) {',
  '    float fi = float(i);',
  '    float h1 = hash11(fi * 71.13 + 5.0);',
  '    float h2 = hash11(fi * 97.31 + 11.0);',
  '    float h3 = hash11(fi * 37.71 + 17.0);',
  '    float angle = 0.5 + h1 * 1.2;',
  '    float offset = h2 * 2.0 - 1.0;',
  '    float ca = cos(angle), sa = sin(angle);',
  '    float lineVal = (uv.x - 0.5) * ca + (uv.y - 0.5) * sa + offset * 0.3;',
  '    lineVal += vnoise(vec2(uv.x * 8.0 + fi * 50.0, uv.y * 8.0 + t * 0.05)) * 0.02;',
  '    float faultWidth = 0.003 + h3 * 0.004;',
  '    float side = smoothstep(-faultWidth, faultWidth, lineVal);',
  '    float dispAmount = (0.01 + h3 * 0.02) * sin(t * 0.08 + fi * 2.0);',
  '    totalDisp += side * dispAmount;',
  '  }',
  '  return totalDisp;',
  '}',
  '',
  'float faultLine(vec2 uv, float t) {',
  '  float line = 0.0;',
  '  for (int i = 0; i < 3; i++) {',
  '    float fi = float(i);',
  '    float h1 = hash11(fi * 71.13 + 5.0);',
  '    float h2 = hash11(fi * 97.31 + 11.0);',
  '    float angle = 0.5 + h1 * 1.2;',
  '    float offset = h2 * 2.0 - 1.0;',
  '    float ca = cos(angle), sa = sin(angle);',
  '    float lineVal = (uv.x - 0.5) * ca + (uv.y - 0.5) * sa + offset * 0.3;',
  '    lineVal += vnoise(vec2(uv.x * 8.0 + fi * 50.0, uv.y * 8.0 + t * 0.05)) * 0.02;',
  '    float faultVis = 1.0 - smoothstep(0.0, 0.004, abs(lineVal));',
  '    line = max(line, faultVis * 0.25);',
  '  }',
  '  return line;',
  '}',
  '',
  'void main() {',
  '  vec2 uv = gl_FragCoord.xy / u_res;',
  '  float aspect = u_res.x / u_res.y;',
  '  vec2 uvAspect = vec2(uv.x * aspect, uv.y);',
  '  float t = u_time * u_foldSpeed;',
  '  float layerCount = floor(u_layerCount);',
  '  vec2 warped = tectonicWarp(uvAspect, t);',
  '  vec2 mOff = vec2(0.0);',
  '  if (u_mouse.x >= 0.0) {',
  '    mOff = (u_mouse - 0.5) * vec2(-0.12, -0.06);',
  '  }',
  '  float layerSpacing = 1.0 / (layerCount + 1.0);',
  '  float currentLayer = -1.0;',
  '  float layerPos = 0.0;',
  '  float prevBound = -0.2;',
  '  for (int i = 0; i < 24; i++) {',
  '    if (float(i) >= layerCount) break;',
  '    float fi = float(i);',
  '    float baseY = (fi + 1.0) * layerSpacing;',
  '    float layerDepth = fi / layerCount;',
  '    float px = warped.x + mOff.x * (0.3 + layerDepth * 1.5);',
  '    float bound = layerBoundary(px, baseY, fi, t);',
  '    bound += mOff.y * (0.1 + layerDepth * 0.4);',
  '    if (warped.y >= prevBound && warped.y < bound) {',
  '      currentLayer = fi;',
  '      float thickness = bound - prevBound;',
  '      layerPos = (warped.y - prevBound) / max(thickness, 0.001);',
  '      break;',
  '    }',
  '    prevBound = bound;',
  '  }',
  '  if (currentLayer < 0.0) {',
  '    currentLayer = layerCount;',
  '    layerPos = 0.5;',
  '  }',
  '  vec3 col = stratumColor(currentLayer, layerCount);',
  '  float grain = grainTexture(warped, currentLayer);',
  '  col += grain;',
  '  float edgeShade = smoothstep(0.0, 0.15, layerPos) * smoothstep(1.0, 0.85, layerPos);',
  '  col *= 0.85 + 0.15 * edgeShade;',
  '  float edgeShadow = smoothstep(0.0, 0.08, layerPos);',
  '  col *= 0.82 + 0.18 * edgeShadow;',
  '  float topHighlight = smoothstep(1.0, 0.92, layerPos);',
  '  col += vec3(0.018, 0.03, 0.06) * (1.0 - topHighlight);',
  '  float faultDisp = faultDisplacement(warped, t);',
  '  col += faultDisp * vec3(0.01, 0.015, 0.03);',
  '  float faults = faultLine(warped, t);',
  '  col -= faults * vec3(0.05, 0.06, 0.09);',
  '  float crystals = sparkle(warped, t, currentLayer);',
  '  col += crystals * vec3(0.22, 0.3, 0.46);',
  '  float vig = 1.0 - 0.3 * length((uv - 0.5) * 1.5);',
  '  col *= vig;',
  '  float paperTex = vnoise(gl_FragCoord.xy * 0.15) * 0.03;',
  '  paperTex += (hash21(gl_FragCoord.xy + fract(u_time * 0.1) * 1000.0) - 0.5) * 0.015;',
  '  col += paperTex;',
  '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
  '  col = mix(vec3(lum), col, 0.84);',
  '  col = pow(col, vec3(0.94, 0.96, 0.92));',
  '  gl_FragColor = vec4(col, 1.0);',
  '}',
].join('\n')

export function InnerPageBackground() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isHome = pathname === '/'

  useEffect(() => {
    if (isHome) return

    const canvas = canvasRef.current

    if (!canvas) return

    const canvasEl = canvas
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const context = canvasEl.getContext('webgl', {
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    })

    if (!context) return
    const gl = context

    function compile(type: number, source: string) {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteProgram(program)
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    if (!buffer) {
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteProgram(program)
      return
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRes = gl.getUniformLocation(program, 'u_res')
    const uFoldSpeed = gl.getUniformLocation(program, 'u_foldSpeed')
    const uLayerCount = gl.getUniformLocation(program, 'u_layerCount')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')

    let foldSpeedVal = 0.5
    let layerCountVal = 16
    let mouseX = -1
    let mouseY = -1
    let smoothMX = -1
    let smoothMY = -1

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let needsResize = true
    let running = true
    let frameId = 0

    function resize() {
      needsResize = false
      const width = Math.round(canvasEl.clientWidth * dpr)
      const height = Math.round(canvasEl.clientHeight * dpr)

      if (canvasEl.width !== width || canvasEl.height !== height) {
        canvasEl.width = width
        canvasEl.height = height
        gl.viewport(0, 0, width, height)
        gl.uniform2f(uRes, width, height)
      }
    }

    function render(now: number) {
      if (!running) return
      if (needsResize) resize()

      gl.uniform1f(uTime, prefersReduced ? 0 : now * 0.001)
      gl.uniform1f(uFoldSpeed, foldSpeedVal)
      gl.uniform1f(uLayerCount, layerCountVal)

      if (mouseX >= 0) {
        smoothMX += (mouseX - smoothMX) * 0.06
        smoothMY += (mouseY - smoothMY) * 0.06
      } else {
        smoothMX = -1
        smoothMY = -1
      }

      gl.uniform2f(uMouse, smoothMX, smoothMY)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      frameId = window.requestAnimationFrame(render)
    }

    function markResize() {
      needsResize = true
    }

    function updateMouse(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      mouseX = (event.clientX - rect.left) / rect.width
      mouseY = 1 - (event.clientY - rect.top) / rect.height
    }

    function clearMouse() {
      mouseX = -1
      mouseY = -1
    }

    function onVisibilityChange() {
      running = !document.hidden
      if (running && frameId === 0) {
        frameId = window.requestAnimationFrame(render)
      }
    }

    function onMessage(event: MessageEvent<{ type?: string; name?: string; value?: number }>) {
      if (event.data?.type !== 'param') return
      if (event.data.name === 'FOLD_SPEED' && typeof event.data.value === 'number') {
        foldSpeedVal = event.data.value
      }
      if (event.data.name === 'LAYER_COUNT' && typeof event.data.value === 'number') {
        layerCountVal = event.data.value
      }
    }

    window.addEventListener('resize', markResize)
    window.addEventListener('pointermove', updateMouse, { passive: true })
    window.addEventListener('blur', clearMouse)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('message', onMessage)

    resize()
    frameId = window.requestAnimationFrame(render)

    return () => {
      running = false
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', markResize)
      window.removeEventListener('pointermove', updateMouse)
      window.removeEventListener('blur', clearMouse)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('message', onMessage)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [isHome])

  if (isHome) return null

  return (
    <div
      aria-hidden
      data-route-background="painted-strata"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[linear-gradient(180deg,#07101d_0%,#0b1830_42%,#09111f_100%)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,121,191,0.12),transparent_42%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-95" />
    </div>
  )
}
