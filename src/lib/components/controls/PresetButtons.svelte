<script lang="ts">
	export interface PresetOption {
		key: string;
		label: string;
		active?: boolean;
		disabled?: boolean;
	}

	let {
		options,
		onselect
	}: {
		options: PresetOption[];
		onselect: (key: string) => void;
	} = $props();
</script>

<div class="presets">
	{#each options as option (option.key)}
		{#if !option.disabled}
			<button class:on={option.active} onclick={() => onselect(option.key)}>{option.label}</button>
		{/if}
	{/each}
</div>

<style>
	.presets {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	button {
		padding: 0.3rem 0.55rem;
		background: rgba(8, 20, 31, 0.6);
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 6px;
		color: #6f8aa3;
		font-family: inherit;
		font-size: 0.68rem;
		cursor: pointer;
	}
	button.on {
		color: #e6f1ff;
		border-color: rgba(0, 212, 255, 0.5);
	}
</style>
