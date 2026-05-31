<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer>
	© 2026 <a href="https://okayu.jp" target="_blank" rel="noopener noreferrer">Yumeto Inaoka</a>.
</footer>

<style>
	footer {
		position: fixed;
		bottom: 0;
		width: 100%;
		padding: 0.35rem 1rem;
		text-align: center;
		font-size: 0.7rem;
		color: #4a5568;
		pointer-events: none;
	}

	footer a {
		color: #4a5568;
		text-decoration: none;
		pointer-events: auto;
	}

	footer a:hover {
		color: #718096;
	}
</style>
