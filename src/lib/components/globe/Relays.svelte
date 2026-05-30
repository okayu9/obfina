<script lang="ts">
	import { T } from '@threlte/core';
	import {
		Color,
		InstancedMesh,
		MeshBasicMaterial,
		Object3D,
		SphereGeometry
	} from 'three';
	import { COUNTRY_CENTROIDS } from '$lib/country-centroids';
	import { latLonToVector3 } from '$lib/globe-math';
	import type { Relay } from '$lib/types';

	let { relays, radius = 1 }: { relays: Relay[]; radius?: number } = $props();

	// Shared geometry/material — one draw call for all relays (see ADR-002).
	const geometry = new SphereGeometry(0.006, 6, 6);
	const material = new MeshBasicMaterial({ toneMapped: false });

	const EXIT = new Color(0x39ff14);
	const GUARD = new Color(0x00d4ff);
	const MIDDLE = new Color(0x5a7a99);

	// Deterministic jitter so relays in the same country fan out around the
	// centroid instead of stacking on one point.
	function jitter(seed: number): number {
		const x = Math.sin(seed * 12.9898) * 43758.5453;
		return (x - Math.floor(x) - 0.5) * 7;
	}

	const mesh = $derived.by(() => {
		const placed = relays.filter((r) => COUNTRY_CENTROIDS[r.country]);
		const im = new InstancedMesh(geometry, material, placed.length);
		const dummy = new Object3D();

		placed.forEach((r, i) => {
			const [lat, lon] = COUNTRY_CENTROIDS[r.country];
			const pos = latLonToVector3(lat + jitter(i + 1), lon + jitter(i + 7), radius * 1.01);
			dummy.position.copy(pos);
			dummy.scale.setScalar(0.5 + Math.min(r.bandwidth / 4e7, 3));
			dummy.updateMatrix();
			im.setMatrixAt(i, dummy.matrix);

			const color = r.flags.includes('Exit') ? EXIT : r.flags.includes('Guard') ? GUARD : MIDDLE;
			im.setColorAt(i, color);
		});

		im.instanceMatrix.needsUpdate = true;
		if (im.instanceColor) im.instanceColor.needsUpdate = true;
		return im;
	});
</script>

<T is={mesh} />
