<script lang="ts">
	import ValueByAlphaMap from '$lib/components/map/ValueByAlphaMap.svelte';
	import MapSimulationLayer from '$lib/components/map/MapSimulationLayer.svelte';
	import MapHud from '$lib/components/map/MapHud.svelte';
	import CountryPanel from '$lib/components/panels/CountryPanel.svelte';
	import { aggregateByCountry, totalRelayBandwidth } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';
	import { relayStore } from '$lib/stores/relays.svelte';
	import { getMessages } from '$lib/i18n/index.svelte';

	const t = $derived(getMessages());
	const byCountry = $derived(aggregateByCountry(relayStore.relays));
	const selectedStats = $derived(
		selection.country ? (byCountry.get(selection.country) ?? null) : null
	);
	const totalBandwidth = $derived(totalRelayBandwidth(relayStore.relays));
</script>

<ValueByAlphaMap relays={relayStore.relays} />
<MapSimulationLayer relays={relayStore.relays} />

<MapHud
	relayCount={relayStore.count}
	{totalBandwidth}
	relaysLabel={t.map.relays}
	legendExitLabel={t.map.legendExit}
	legendBrightnessLabel={t.map.legendBrightness}
/>

<CountryPanel stats={selectedStats} relays={relayStore.relays} {totalBandwidth} />
