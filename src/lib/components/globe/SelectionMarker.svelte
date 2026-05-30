<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { AdditiveBlending, DoubleSide, Mesh } from 'three';
	import { COUNTRY_CENTROIDS } from '$lib/country-centroids';
	import { latLonToVector3 } from '$lib/globe-math';
	import { selection } from '$lib/stores/selection.svelte';

	let { radius = 1 }: { radius?: number } = $props();

	let ring = $state<Mesh | undefined>();

	const centroid = $derived(selection.country ? COUNTRY_CENTROIDS[selection.country] : undefined);

	// Position and orient the ring tangent to the sphere at the country centroid.
	$effect(() => {
		if (!ring || !centroid) return;
		const pos = latLonToVector3(centroid[0], centroid[1], radius * 1.02);
		ring.position.copy(pos);
		ring.lookAt(0, 0, 0);
	});

	let t = 0;
	useTask((delta) => {
		if (!ring) return;
		t += delta;
		const s = 1 + 0.12 * Math.sin(t * 3);
		ring.scale.setScalar(s);
	});
</script>

{#if centroid}
	<T.Mesh bind:ref={ring}>
		<T.RingGeometry args={[0.06, 0.075, 48]} />
		<T.MeshBasicMaterial
			color={0x00d4ff}
			transparent
			opacity={0.9}
			side={DoubleSide}
			blending={AdditiveBlending}
			depthWrite={false}
		/>
	</T.Mesh>
{/if}
