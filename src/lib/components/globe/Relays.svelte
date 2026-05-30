<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import {
		AdditiveBlending,
		BufferGeometry,
		Color,
		Float32BufferAttribute,
		Points,
		ShaderMaterial
	} from 'three';
	import { COUNTRY_CENTROIDS } from '$lib/country-centroids';
	import { discOffset, latLonToVector3 } from '$lib/globe-math';
	import { motion } from '$lib/stores/motion.svelte';
	import type { Relay } from '$lib/types';

	let { relays, radius = 1 }: { relays: Relay[]; radius?: number } = $props();

	// Spread of a country's relays around its centroid, in degrees.
	const SPREAD_DEG = 5;

	const EXIT = new Color(0x39ff14);
	const GUARD = new Color(0x00d4ff);
	const MIDDLE = new Color(0x5a7a99);

	const material = new ShaderMaterial({
		uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uPulse: { value: 1 } },
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		vertexShader: `
			uniform float uTime;
			uniform float uReveal;
			uniform float uPulse;
			attribute float aSize;
			attribute float aPhase;
			attribute float aDelay;
			attribute vec3 aColor;
			varying vec3 vColor;
			varying float vGlow;
			varying float vReveal;
			void main() {
				vColor = aColor;
				// Staggered fade-in: each relay reveals around its own delay.
				vReveal = smoothstep(aDelay, aDelay + 0.3, uReveal);
				// Independent twinkle per relay (amplitude scaled by uPulse).
				float pulse = 0.6 + 0.4 * uPulse * sin(uTime * 1.5 + aPhase);
				vGlow = pulse;
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				gl_PointSize = aSize * pulse * vReveal * (300.0 / -mv.z);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			varying vec3 vColor;
			varying float vGlow;
			varying float vReveal;
			void main() {
				// Soft radial falloff for a glowing dot.
				float d = length(gl_PointCoord - vec2(0.5));
				if (d > 0.5) discard;
				float alpha = smoothstep(0.5, 0.0, d);
				gl_FragColor = vec4(vColor * (0.6 + vGlow), alpha * (0.5 + 0.5 * vGlow) * vReveal);
			}
		`
	});

	const points = $derived.by(() => {
		const placed = relays.filter((r) => COUNTRY_CENTROIDS[r.country]);
		const positions = new Float32Array(placed.length * 3);
		const colors = new Float32Array(placed.length * 3);
		const sizes = new Float32Array(placed.length);
		const phases = new Float32Array(placed.length);
		const delays = new Float32Array(placed.length);

		placed.forEach((r, i) => {
			const [lat, lon] = COUNTRY_CENTROIDS[r.country];
			const [dLat, dLon] = discOffset(i + 1, SPREAD_DEG, lat);
			const pos = latLonToVector3(lat + dLat, lon + dLon, radius * 1.012);
			positions[i * 3] = pos.x;
			positions[i * 3 + 1] = pos.y;
			positions[i * 3 + 2] = pos.z;

			const c = r.flags.includes('Exit') ? EXIT : r.flags.includes('Guard') ? GUARD : MIDDLE;
			colors[i * 3] = c.r;
			colors[i * 3 + 1] = c.g;
			colors[i * 3 + 2] = c.b;

			sizes[i] = 0.04 + Math.min(r.bandwidth / 4e7, 1) * 0.16;
			phases[i] = (i % 97) * 0.34;
			delays[i] = (i % 71) / 100; // 0..0.7 staggered reveal
		});

		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
		geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
		geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));
		geometry.setAttribute('aDelay', new Float32BufferAttribute(delays, 1));

		// Restart the reveal whenever the relay set is (re)built.
		material.uniforms.uReveal.value = 0;
		return new Points(geometry, material);
	});

	useTask((delta) => {
		material.uniforms.uTime.value += delta;
		material.uniforms.uPulse.value = motion.reduced ? 0 : 1;
		if (material.uniforms.uReveal.value < 1) {
			material.uniforms.uReveal.value = Math.min(1, material.uniforms.uReveal.value + delta / 1.3);
		}
	});
</script>

<T is={points} />
