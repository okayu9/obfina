export const en = {
	// Navigation labels
	nav: {
		map: 'MAP',
		mapDesc: 'Relays by country',
		hosting: 'HOSTING',
		hostingDesc: 'AS concentration risk',
		paths: 'PATHS',
		pathsDesc: 'Path-selection bias',
		growth: 'GROWTH',
		growthDesc: 'Capacity & usage over time',
		circuits: 'SIMULATION',
		circuitsDesc: 'Statistical simulation of Tor circuit building',
		about: 'ABOUT',
		aboutDesc: 'Data sources & references',
		hint: '1–6 · ← →'
	},

	// Language switcher
	lang: {
		en: 'EN',
		ja: '日本語'
	},

	// Loading screen
	loading: {
		default: 'Fetching relay data…',
		unavailable: 'Relay data unavailable',
		historical: 'Historical data unavailable',
		metrics: 'Fetching Tor Metrics…'
	},

	// Map view
	map: {
		relays: 'relays',
		legendExit: 'cyan→green = exit share',
		legendBrightness: 'brighter = more relays'
	},

	// Country panel
	countryPanel: {
		relays: 'relays',
		moreDetails: 'More details',
		showLess: 'Show less',
		networkBw: 'network BW',
		uniqueAs: 'unique AS',
		topProviders: 'Top providers',
		relayList: 'Relays',
		nickname: 'Nickname',
		bandwidth: 'Bandwidth',
		flags: 'Flags',
		guard: 'Guard',
		guardDesc: "entry — a client's first hop into Tor",
		middle: 'Middle',
		middleDesc: 'relays traffic between guard and exit',
		exit: 'Exit',
		exitDesc: 'last hop — connects out to the destination'
	},

	// Hosting / Centralization view
	hosting: {
		title: 'Hosting concentration',
		description:
			'Share of the network held by its autonomous systems. A curve bowing toward the bottom-right means a few providers carry most of the traffic. Drag the line — or pick a preset — to count the top providers. Click a provider to see its relays.',
		allRelays: 'All relays',
		exitOnly: 'Exit only',
		giniAll: 'Gini · all',
		giniExit: 'Gini · exit',
		heldByTop: 'held by the top',
		of: 'of',
		providers: 'providers',
		top: 'top',
		all: 'all',
		fewerAses: 'fewer ASes →',
		cumulativeShare: '↑ cumulative share',
		moreProviders: 'more',
		relays: 'relays',
		bandwidthShare: 'bandwidth share',
		consensusShare: 'consensus share',
		nickname: 'Nickname',
		cc: 'CC',
		bandwidth: 'Bandwidth',
		flags: 'Flags'
	},

	// Paths view
	paths: {
		title: 'Path-selection bias',
		description:
			'Tor weights relays by capacity, so a small set of high-bandwidth relays carries a large share of all traffic. Drag the line — or pick a preset — to read how much.',
		ofTrafficRidesOn: 'of all traffic rides on the top',
		ofRelays: 'of relays',
		giniConsensus: 'Gini · consensus weight',
		topRelays: 'top relays →',
		shareOfTraffic: '↑ share of traffic',
		legendConsensus: 'consensus weight (path selection)',
		legendGuard: 'guard position',
		legendExit: 'exit position',
		legendEquality: 'perfect equality',
		top: 'top'
	},

	// Growth / Trends view
	growth: {
		title: 'Network over time',
		description:
			"Growth of the relay network, the gap between advertised capacity and bandwidth actually used, and where Tor's users connect from. Source: Tor Metrics.",
		runningRelays: 'running relays',
		capacityUsed: 'capacity used',
		advertised: 'advertised',
		consumed: 'consumed',
		relays: 'relays',
		dailyUsers: 'daily users'
	},

	// Circuits view
	circuits: {
		title: 'Circuit Simulation',
		subtitle: 'A statistical simulation based on real relay data. These are not actual live circuits.',
		unknownAs: 'unknown AS',
		guardLabel: 'Guard',
		middleLabel: 'Middle',
		exitLabel: 'Exit'
	},

	// About view
	about: {
		title: 'Data Sources & References',
		subtitle:
			'This visualization is built on open data published by the Tor Project and the network research community.',
		dataSources: 'Data Sources',
		references: 'References'
	},

	// Footer
	footer: {
		dataAsOf: 'Data as of'
	}
};

// Messages is a deep-string version of the en object's shape.
// Using `typeof en` with `as const` would lock translations to literal types;
// instead we derive the shape structurally so any locale can satisfy it.
export type Messages = typeof en;
