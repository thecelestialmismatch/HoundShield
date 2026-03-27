"use client";

import { useEffect, useRef } from "react";

/**
 * WebGL particle field — 420 particles with mouse-following effect.
 * Ported from kaelus-landing-3d.html reference.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glOpts = { alpha: true, premultipliedAlpha: false };
    const gl = (
      canvas.getContext("webgl", glOpts) ||
      canvas.getContext("experimental-webgl", glOpts)
    ) as WebGLRenderingContext | null;
    if (!gl) return;

    /* ── Resize ──────────────────────────────────── */
    function resize() {
      if (!canvas || !gl) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      (gl as WebGLRenderingContext).viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    /* ── Shaders ─────────────────────────────────── */
    const vs = `
      attribute vec3 a_pos;
      attribute float a_alpha;
      uniform float u_time;
      uniform vec2 u_mouse;
      varying float v_alpha;
      void main() {
        vec3 pos = a_pos;
        pos.z += sin(u_time * 0.3 + a_pos.x * 2.0) * 0.08;
        pos.x += sin(u_time * 0.2 + a_pos.y * 1.5) * 0.04;
        pos.x += u_mouse.x * 0.15;
        pos.y += u_mouse.y * 0.1;
        gl_Position = vec4(pos.xy, 0.0, 1.0 + pos.z * 0.5);
        gl_PointSize = (2.5 + a_alpha * 2.0) / (1.0 + pos.z * 0.5);
        v_alpha = a_alpha * (0.4 + 0.6 * (1.0 - abs(pos.z)));
      }`;

    const fs = `
      precision mediump float;
      varying float v_alpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float soft = 1.0 - smoothstep(0.2, 0.5, d);
        gl_FragColor = vec4(0.39, 0.40, 0.95, v_alpha * soft);
      }`;

    function mkShader(type: number, src: string) {
      const s = (gl as WebGLRenderingContext).createShader(type);
      if (!s) return null;
      (gl as WebGLRenderingContext).shaderSource(s, src);
      (gl as WebGLRenderingContext).compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;

    const vertShader = mkShader(gl.VERTEX_SHADER, vs);
    const fragShader = mkShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    /* ── Particle Data ───────────────────────────── */
    const N = 420;
    const pos = new Float32Array(N * 3);
    const alphas = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      alphas[i] = 0.2 + Math.random() * 0.8;
    }

    function buf(data: Float32Array, attr: string, size: number) {
      const b = (gl as WebGLRenderingContext).createBuffer();
      (gl as WebGLRenderingContext).bindBuffer((gl as WebGLRenderingContext).ARRAY_BUFFER, b);
      (gl as WebGLRenderingContext).bufferData(
        (gl as WebGLRenderingContext).ARRAY_BUFFER,
        data,
        (gl as WebGLRenderingContext).STATIC_DRAW
      );
      const loc = (gl as WebGLRenderingContext).getAttribLocation(prog!, attr);
      (gl as WebGLRenderingContext).enableVertexAttribArray(loc);
      (gl as WebGLRenderingContext).vertexAttribPointer(
        loc,
        size,
        (gl as WebGLRenderingContext).FLOAT,
        false,
        0,
        0
      );
    }

    buf(pos, "a_pos", 3);
    buf(alphas, "a_alpha", 1);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    /* ── Mouse Tracking ──────────────────────────── */
    let mx = 0;
    let my = 0;
    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    document.addEventListener("mousemove", onMouseMove);

    /* ── Render Loop ─────────────────────────────── */
    let t = 0;
    let animId: number;

    function frame() {
      t += 0.008;
      (gl as WebGLRenderingContext).clearColor(0, 0, 0, 0);
      (gl as WebGLRenderingContext).clear((gl as WebGLRenderingContext).COLOR_BUFFER_BIT);
      (gl as WebGLRenderingContext).uniform1f(uTime, t);
      (gl as WebGLRenderingContext).uniform2f(uMouse, mx * 0.05, my * 0.05);
      (gl as WebGLRenderingContext).drawArrays((gl as WebGLRenderingContext).POINTS, 0, N);
      animId = requestAnimationFrame(frame);
    }
    frame();

    /* ── Cleanup ─────────────────────────────────── */
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-screen z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
