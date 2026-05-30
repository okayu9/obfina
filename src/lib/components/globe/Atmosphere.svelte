<script lang="ts">
	import { T } from '@threlte/core';
	import { AdditiveBlending, BackSide, ShaderMaterial } from 'three';

	let { radius = 1, scale = 1.15 }: { radius?: number; scale?: number } = $props();

	// Fresnel rim glow: brightest where the surface faces away from the camera,
	// producing a soft atmospheric halo around the globe's edge.
	const material = new ShaderMaterial({
		transparent: true,
		blending: AdditiveBlending,
		side: BackSide,
		depthWrite: false,
		uniforms: { uColor: { value: [0.0, 0.55, 0.85] } },
		vertexShader: `
			varying vec3 vNormal;
			varying vec3 vView;
			void main() {
				vNormal = normalize(normalMatrix * normal);
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				vView = normalize(-mv.xyz);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			uniform vec3 uColor;
			varying vec3 vNormal;
			varying vec3 vView;
			void main() {
				float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 3.0);
				gl_FragColor = vec4(uColor * fresnel, fresnel);
			}
		`
	});
</script>

<T.Mesh {scale}>
	<T.SphereGeometry args={[radius, 48, 48]} />
	<T is={material} attach="material" />
</T.Mesh>
