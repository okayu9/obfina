<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import type { Relay } from '$lib/types';
	import Relays from './Relays.svelte';

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

<!-- The globe body -->
<T.Mesh>
	<T.SphereGeometry args={[1, 64, 64]} />
	<T.MeshPhongMaterial color={0x0a1929} emissive={0x040d18} shininess={8} />
</T.Mesh>

<!-- Faint wireframe atmosphere -->
<T.Mesh scale={1.015}>
	<T.SphereGeometry args={[1, 36, 24]} />
	<T.MeshBasicMaterial color={0x0d3a5c} wireframe transparent opacity={0.12} />
</T.Mesh>

<Relays {relays} />
