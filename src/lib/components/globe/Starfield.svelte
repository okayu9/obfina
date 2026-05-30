<script lang="ts">
	import { T } from '@threlte/core';
	import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from 'three';

	let { count = 1600, radius = 40 }: { count?: number; radius?: number } = $props();

	const stars = (() => {
		const positions = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			// Random direction on a sphere, pushed to the far backdrop.
			const u = Math.random() * 2 - 1;
			const theta = Math.random() * Math.PI * 2;
			const s = Math.sqrt(1 - u * u);
			const r = radius * (0.8 + Math.random() * 0.2);
			positions[i * 3] = r * s * Math.cos(theta);
			positions[i * 3 + 1] = r * u;
			positions[i * 3 + 2] = r * s * Math.sin(theta);
		}
		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		const material = new PointsMaterial({
			color: 0x9fc6e0,
			size: 0.12,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.8,
			blending: AdditiveBlending,
			depthWrite: false
		});
		return new Points(geometry, material);
	})();
</script>

<T is={stars} />
