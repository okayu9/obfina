<script lang="ts">
	import logo from '$lib/assets/favicon.svg';
</script>

<span class="brand"><img src={logo} alt="" class="brand-logo" />OBFINA</span>

<style>
	.brand {
		display: flex;
		align-items: center;
		font-size: 0.6rem;
		letter-spacing: 0.3em;
		color: rgba(0, 212, 255, 0.4);
		margin-right: 0.5rem;
		user-select: none;
	}
	.brand-logo {
		height: 18px;
		width: 18px;
		margin-right: 0.35rem;
		flex-shrink: 0;
	}
</style>
