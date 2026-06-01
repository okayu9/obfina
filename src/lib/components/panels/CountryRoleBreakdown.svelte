<script lang="ts">
	import type { Messages } from '$lib/i18n/index.svelte';
	import { countryRoleBreakdown, type CountryStats } from '$lib/relay-stats';

	let {
		stats,
		t
	}: {
		stats: CountryStats;
		t: Messages['countryPanel'];
	} = $props();

	const roles = $derived([
		...countryRoleBreakdown(stats).map((role) => ({
			...role,
			name: t[role.key],
			desc: t[`${role.key}Desc`]
		}))
	]);
</script>

<div class="bar" role="img" aria-label="relay role composition">
	{#each roles as role (role.key)}
		<div class="seg {role.key}" style:width="{role.share * 100}%"></div>
	{/each}
</div>

<ul class="roles">
	{#each roles as role (role.key)}
		<li>
			<i class="dot {role.key}"></i>
			<div class="role-text">
				<span class="role-name">{role.name}</span>
				<span class="role-desc">{role.desc}</span>
			</div>
			<span class="role-count">{role.count.toLocaleString()}</span>
		</li>
	{/each}
</ul>

<style>
	.bar {
		margin-top: 1.2rem;
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
	}
	.seg.guard {
		background: #00d4ff;
	}
	.seg.middle {
		background: #5a7a99;
	}
	.seg.exit {
		background: #39ff14;
	}
	.roles {
		list-style: none;
		margin: 0.9rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.roles li {
		display: grid;
		grid-template-columns: 8px 1fr auto;
		align-items: baseline;
		gap: 0.5rem;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		transform: translateY(1px);
	}
	.dot.guard {
		background: #00d4ff;
	}
	.dot.middle {
		background: #5a7a99;
	}
	.dot.exit {
		background: #39ff14;
	}
	.role-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.role-name {
		font-size: 0.85rem;
		color: #e6f1ff;
	}
	.role-desc {
		font-size: 0.7rem;
		line-height: 1.3;
		color: #6f8aa3;
	}
	.role-count {
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		color: #9fc6e0;
	}
</style>
