<script lang="ts">
	import { T } from '@threlte/core';
	import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';
	import { mesh } from 'topojson-client';
	import worldData from 'world-atlas/countries-110m.json';
	import { latLonToVector3 } from '$lib/globe-math';

	let { radius = 1 }: { radius?: number } = $props();

	// Minimal shape of the world-atlas TopoJSON we rely on; the full type lives
	// in topojson-specification, which we don't depend on.
	type WorldTopology = Parameters<typeof mesh>[0] & {
		objects: { countries: Parameters<typeof mesh>[1] };
	};

	// Country borders as a single MultiLineString (shared edges drawn once).
	const topology = worldData as unknown as WorldTopology;
	const borders = mesh(topology, topology.objects.countries);

	const lines = (() => {
		const positions: number[] = [];
		for (const line of borders.coordinates) {
			for (let i = 0; i < line.length - 1; i++) {
				const [lonA, latA] = line[i];
				const [lonB, latB] = line[i + 1];
				const a = latLonToVector3(latA, lonA, radius * 1.002);
				const b = latLonToVector3(latB, lonB, radius * 1.002);
				positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
			}
		}
		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		const material = new LineBasicMaterial({ color: 0x1d4e6e, transparent: true, opacity: 0.55 });
		return new LineSegments(geometry, material);
	})();
</script>

<T is={lines} />
