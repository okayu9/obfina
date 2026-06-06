<script lang="ts">
	import ValueByAlphaMap from '$lib/components/map/ValueByAlphaMap.svelte';
	import MapHud from '$lib/components/map/MapHud.svelte';
	import CountryPanel from '$lib/components/panels/CountryPanel.svelte';
	import {
		aggregateByCountry,
		simulationRelaysFromCountries,
		totalRelayBandwidth
	} from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';
	import { relayStore } from '$lib/stores/relays.svelte';
	import { getMessages } from '$lib/i18n/index.svelte';

	const t = $derived(getMessages());
	const byCountry = $derived(
		relayStore.countries.length
			? new Map(relayStore.countries.map((stats) => [stats.country, stats]))
			: aggregateByCountry(relayStore.relays)
	);
	const selectedStats = $derived(
		selection.country ? (byCountry.get(selection.country) ?? null) : null
	);
	const totalBandwidth = $derived(
		relayStore.totalBandwidth || totalRelayBandwidth(relayStore.relays)
	);
	const simulationRelays = $derived(
		relayStore.relays.length
			? relayStore.relays
			: simulationRelaysFromCountries(relayStore.countries)
	);
</script>

<ValueByAlphaMap
	relays={relayStore.relays}
	countryStats={relayStore.countries}
	{simulationRelays}
/>

<MapHud
	relayCount={relayStore.count}
	{totalBandwidth}
	loaded={relayStore.loaded}
	relaysLabel={t.map.relays}
	legendExitLabel={t.map.legendExit}
	legendBrightnessLabel={t.map.legendBrightness}
/>

<CountryPanel stats={selectedStats} relays={relayStore.relays} {totalBandwidth} />
