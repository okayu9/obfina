<script lang="ts">
	import { getMessages } from '$lib/i18n/index.svelte';

	const t = $derived(getMessages());
</script>

<div class="view">
	<header>
		<h1>{t.about.title}</h1>
		<p>{t.about.subtitle}</p>
	</header>

	<div class="body">
		<section>
			<h2>{t.about.dataSources}</h2>
			<div class="cards">
				<a
					href="https://metrics.torproject.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Tor Metrics</div>
					<div class="card-desc">
						Relay statistics, bandwidth history, and user counts published by the Tor Project.
					</div>
					<div class="card-url">metrics.torproject.org</div>
				</a>

				<a
					href="https://onionoo.torproject.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Onionoo API</div>
					<div class="card-desc">
						JSON API providing per-relay details including flags, bandwidth, country, and AS
						information.
					</div>
					<div class="card-url">onionoo.torproject.org</div>
				</a>

				<a
					href="https://asrank.caida.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">CAIDA AS Rank</div>
					<div class="card-desc">
						Autonomous system and ISP information used to assess hosting concentration risk.
					</div>
					<div class="card-url">asrank.caida.org</div>
				</a>
			</div>
		</section>

		<section>
			<h2>{t.about.references}</h2>
			<div class="cards">
				<a
					href="https://svn.torproject.org/svn/projects/design-paper/tor-design.pdf"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Tor Design Paper</div>
					<div class="card-desc">
						Dingledine, Mathewson &amp; Syverson (2004). Describes the onion routing architecture,
						path selection algorithm, and threat model that Tor is built on.
					</div>
					<div class="card-url">tor-design.pdf</div>
				</a>

				<a
					href="https://www.torproject.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">The Tor Project</div>
					<div class="card-desc">
						Official website of the non-profit organization that develops and maintains the Tor
						network.
					</div>
					<div class="card-url">torproject.org</div>
				</a>

				<a
					href="https://metrics.torproject.org/rs.html"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Tor Relay Search (Atlas)</div>
					<div class="card-desc">
						Browse and search currently live Tor relays and bridges, inspect flags, bandwidth, and
						uptime.
					</div>
					<div class="card-url">metrics.torproject.org/rs.html</div>
				</a>

				<a
					href="https://spec.torproject.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Tor Specifications</div>
					<div class="card-desc">
						The canonical technical specification for the Tor protocol, directory protocol, and path
						selection algorithm.
					</div>
					<div class="card-url">spec.torproject.org</div>
				</a>

				<a
					href="https://www.usenix.org/system/files/conference/usenixsecurity13/sec13-paper_johnson.pdf"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">"Users Get Routed" (Johnson et al., 2013)</div>
					<div class="card-desc">
						Traffic correlation attack analysis showing how an adversary controlling AS-level
						positions can deanonymize Tor users.
					</div>
					<div class="card-url">cse.unr.edu — users-routed.pdf</div>
				</a>

				<a
					href="https://community.torproject.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Tor Community Portal</div>
					<div class="card-desc">
						Official guides for relay operators, bridge operators, and contributors who keep the Tor
						network running.
					</div>
					<div class="card-url">community.torproject.org</div>
				</a>

				<a
					href="https://ooni.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">OONI — Open Observatory of Network Interference</div>
					<div class="card-desc">
						Measures internet censorship worldwide; contextualises where Tor usage data reflects
						blocked access rather than voluntary adoption.
					</div>
					<div class="card-url">ooni.org</div>
				</a>
			</div>
		</section>

		<section>
			<h2>Related Organisations</h2>
			<div class="cards">
				<a
					href="https://www.eff.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Electronic Frontier Foundation</div>
					<div class="card-desc">
						Digital rights organisation that has long advocated for and supported the Tor Project,
						and publishes Surveillance Self-Defense guides.
					</div>
					<div class="card-url">eff.org</div>
				</a>

				<a
					href="https://freedom.press/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Freedom of the Press Foundation</div>
					<div class="card-desc">
						Trains journalists in digital security tools including Tor Browser; a major institutional
						supporter of the Tor network.
					</div>
					<div class="card-url">freedom.press</div>
				</a>

				<a
					href="https://www.accessnow.org/"
					target="_blank"
					rel="noopener noreferrer"
					class="card"
				>
					<div class="card-name">Access Now</div>
					<div class="card-desc">
						Defends and extends the digital rights of users at risk globally, with a focus on
						circumvention tools in high-censorship regions.
					</div>
					<div class="card-url">accessnow.org</div>
				</a>
			</div>
		</section>

		<section>
			<h2>Author</h2>
			<div class="cards">
				<a href="https://okayu.jp" target="_blank" rel="noopener noreferrer" class="card">
					<div class="card-name">Yumeto Inaoka</div>
					<div class="card-desc">
						Software engineer based in Japan. Built obfina to make Tor network health legible to a
						wider audience.
					</div>
					<div class="card-url">okayu.jp</div>
				</a>
			</div>
		</section>
	</div>
</div>

<style>
	.view {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		padding: 4.5rem 2rem 2rem 2rem;
		gap: 1.2rem;
		overflow: auto;
	}
	header h1 {
		margin: 0;
		font-size: 1.1rem;
		letter-spacing: 0.12em;
		color: #e6f1ff;
		text-transform: uppercase;
	}
	header p {
		margin: 0.4rem 0 0;
		max-width: 50ch;
		font-size: 0.74rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	section h2 {
		margin: 0 0 0.75rem;
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #3a5266;
	}
	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.85rem 1.1rem;
		width: 22rem;
		max-width: 100%;
		background: #0b1824;
		border: 1px solid #1e3044;
		border-radius: 4px;
		text-decoration: none;
		transition:
			border-color 0.18s,
			background 0.18s;
	}
	.card:hover {
		border-color: #2a4a66;
		background: #0e1f30;
	}
	.card-name {
		font-size: 0.82rem;
		letter-spacing: 0.08em;
		color: #9fc6e0;
	}
	.card-desc {
		font-size: 0.7rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
	.card-url {
		margin-top: 0.2rem;
		font-size: 0.62rem;
		letter-spacing: 0.06em;
		color: #2a4a66;
		font-variant-numeric: tabular-nums;
	}
</style>
