<script lang="ts">
	import { T } from '@threlte/core';
	import { interactivity, OrbitControls, type IntersectionEvent } from '@threlte/extras';
	import { COUNTRY_CENTROIDS } from '$lib/country-centroids';
	import { nearestCountry, vector3ToLatLon } from '$lib/globe-math';
	import { selection } from '$lib/stores/selection.svelte';
	import { motion } from '$lib/stores/motion.svelte';
	import type { Relay } from '$lib/types';
	import Atmosphere from './Atmosphere.svelte';
	import Landmass from './Landmass.svelte';
	import Relays from './Relays.svelte';
	import SelectionMarker from './SelectionMarker.svelte';
	import Starfield from './Starfield.svelte';

	let { relays }: { relays: Relay[] } = $props();

	interactivity();

	function handleGlobeClick(e: IntersectionEvent<MouseEvent>) {
		const [lat, lon] = vector3ToLatLon(e.point);
		selection.country = nearestCountry(lat, lon, COUNTRY_CENTROIDS);
	}

	function setCursor(value: string) {
		if (typeof document !== 'undefined') document.body.style.cursor = value;
	}
</script>

<T.PerspectiveCamera makeDefault position={[0, 0.5, 3]} fov={45}>
	<OrbitControls
		enableDamping
		dampingFactor={0.05}
		enableZoom
		autoRotate={!selection.country && !motion.reduced}
		autoRotateSpeed={0.35}
		minDistance={1.4}
		maxDistance={6}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[5, 3, 5]} intensity={1.1} />

<Starfield />
<Atmosphere />

<!-- The globe body (also the click target for country selection) -->
<T.Mesh
	onclick={handleGlobeClick}
	onpointerenter={() => setCursor('pointer')}
	onpointerleave={() => setCursor('default')}
>
	<T.SphereGeometry args={[1, 64, 64]} />
	<T.MeshPhongMaterial color={0x0a1929} emissive={0x040d18} shininess={8} />
</T.Mesh>

<!-- Country borders traced on the surface -->
<Landmass />

<Relays {relays} />
<SelectionMarker />
