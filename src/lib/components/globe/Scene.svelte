<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import type { Relay } from '$lib/types';
	import Atmosphere from './Atmosphere.svelte';
	import Landmass from './Landmass.svelte';
	import Relays from './Relays.svelte';
	import Starfield from './Starfield.svelte';

	let { relays }: { relays: Relay[] } = $props();
</script>

<T.PerspectiveCamera makeDefault position={[0, 0.5, 3]} fov={45}>
	<OrbitControls
		enableDamping
		dampingFactor={0.05}
		enableZoom
		autoRotate
		autoRotateSpeed={0.35}
		minDistance={1.4}
		maxDistance={6}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[5, 3, 5]} intensity={1.1} />

<Starfield />
<Atmosphere />

<!-- The globe body -->
<T.Mesh>
	<T.SphereGeometry args={[1, 64, 64]} />
	<T.MeshPhongMaterial color={0x0a1929} emissive={0x040d18} shininess={8} />
</T.Mesh>

<!-- Country borders traced on the surface -->
<Landmass />

<Relays {relays} />
