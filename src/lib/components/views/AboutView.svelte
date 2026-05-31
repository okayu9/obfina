<div class="view">
	<header>
		<h1>Data Sources &amp; References</h1>
		<p>
			This visualization is built on open data published by the Tor Project and the network
			research community.
		</p>
	</header>

	<div class="body">
		<section>
			<h2>Data Sources</h2>
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
			<h2>References</h2>
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
		padding: 4.5rem 2rem 2rem 14rem;
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
