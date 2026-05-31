<script lang="ts">
	import { getMessages, getLocale } from '$lib/i18n/index.svelte';

	const t = $derived(getMessages());
	const locale = $derived(getLocale());

	const dataSources = [
		{
			href: 'https://metrics.torproject.org/',
			name: 'Tor Metrics',
			desc: 'Relay statistics, bandwidth history, and user counts published by the Tor Project.',
			descJa: 'Torプロジェクトが公開するリレー統計、帯域幅の履歴、利用者数データ。',
			url: 'metrics.torproject.org'
		},
		{
			href: 'https://onionoo.torproject.org/',
			name: 'Onionoo API',
			desc: 'JSON API providing per-relay details including flags, bandwidth, country, and AS information.',
			descJa: 'フラグ、帯域幅、国、AS情報などリレーごとの詳細を提供するJSON API。',
			url: 'onionoo.torproject.org'
		},
		{
			href: 'https://asrank.caida.org/',
			name: 'CAIDA AS Rank',
			desc: 'Autonomous system and ISP information used to assess hosting concentration risk.',
			descJa: 'ホスティング集中リスクの評価に使用する自律システム（AS）およびISP情報。',
			url: 'asrank.caida.org'
		}
	];

	const references = [
		{
			href: 'https://svn-archive.torproject.org/svn/projects/design-paper/tor-design.pdf',
			name: 'Tor Design Paper',
			desc: 'Dingledine, Mathewson & Syverson (2004). Describes the onion routing architecture, path selection algorithm, and threat model that Tor is built on.',
			descJa:
				'Dingledine・Mathewson・Syverson（2004年）。Torの基盤となるオニオンルーティングの仕組み、経路選択アルゴリズム、脅威モデルを解説した論文。',
			url: 'svn-archive.torproject.org'
		},
		{
			href: 'https://www.torproject.org/',
			name: 'The Tor Project',
			desc: 'Official website of the non-profit organization that develops and maintains the Tor network.',
			descJa: 'Torネットワークを開発・維持する非営利組織の公式サイト。',
			url: 'torproject.org'
		},
		{
			href: 'https://metrics.torproject.org/rs.html',
			name: 'Tor Relay Search (Atlas)',
			desc: 'Browse and search currently live Tor relays and bridges, inspect flags, bandwidth, and uptime.',
			descJa: '稼働中のTorリレーやブリッジを検索し、フラグ・帯域幅・稼働時間を確認できるツール。',
			url: 'metrics.torproject.org/rs.html'
		},
		{
			href: 'https://spec.torproject.org/',
			name: 'Tor Specifications',
			desc: 'The canonical technical specification for the Tor protocol, directory protocol, and path selection algorithm.',
			descJa: 'Torプロトコル、ディレクトリプロトコル、経路選択アルゴリズムの公式技術仕様書。',
			url: 'spec.torproject.org'
		},
		{
			href: 'https://www.ohmygodel.com/publications/usersrouted-ccs13.pdf',
			name: '"Users Get Routed"',
			desc: 'Traffic correlation attack analysis showing how an adversary controlling AS-level positions can deanonymize Tor users.',
			descJa:
				'ASレベルの経路を制御する攻撃者がTorユーザーを匿名解除できることを示したトラフィック相関攻撃の分析。',
			url: 'ohmygodel.com (ccs13)'
		},
		{
			href: 'https://community.torproject.org/',
			name: 'Tor Community Portal',
			desc: 'Official guides for relay operators, bridge operators, and contributors who keep the Tor network running.',
			descJa: 'Torネットワークを支えるリレー運営者、ブリッジ運営者、貢献者向けの公式ガイド。',
			url: 'community.torproject.org'
		},
		{
			href: 'https://ooni.org/',
			name: 'OONI',
			desc: 'Measures internet censorship worldwide; contextualises where Tor usage data reflects blocked access rather than voluntary adoption.',
			descJa:
				'世界各地のインターネット検閲を計測するプロジェクト。Torの利用データが自発的な採用ではなくアクセス遮断を反映している地域の文脈理解に役立つ。',
			url: 'ooni.org'
		}
	];

	const relatedOrgs = [
		{
			href: 'https://www.eff.org/',
			name: 'Electronic Frontier Foundation',
			desc: 'Digital rights organisation that has long advocated for and supported the Tor Project, and publishes Surveillance Self-Defense guides.',
			descJa:
				'Torプロジェクトを長年支援してきたデジタル権利団体。「自己防衛監視ガイド」も公開している。',
			url: 'eff.org'
		},
		{
			href: 'https://freedom.press/',
			name: 'Freedom of the Press Foundation',
			desc: 'Trains journalists in digital security tools including Tor Browser; a major institutional supporter of the Tor network.',
			descJa:
				'Tor Browserを含むデジタルセキュリティツールをジャーナリストに教育する団体であり、Torネットワークの主要な支援者。',
			url: 'freedom.press'
		},
		{
			href: 'https://www.accessnow.org/',
			name: 'Access Now',
			desc: 'Defends and extends the digital rights of users at risk globally, with a focus on circumvention tools in high-censorship regions.',
			descJa:
				'高度な検閲環境下での迂回ツールに重点を置きつつ、世界中のリスクにさらされたユーザーのデジタル権利を守り拡大する団体。',
			url: 'accessnow.org'
		}
	];

	const authors = [
		{
			href: 'https://okayu.jp',
			name: 'Yumeto Inaoka',
			desc: 'Software engineer based in Japan. Built obfina to make Tor network health legible to a wider audience.',
			descJa:
				'日本在住のソフトウェアエンジニア。Torネットワークの状態をより多くの人に伝えるためにobfinaを制作。',
			url: 'okayu.jp'
		}
	];
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
				{#each dataSources as card}
					<a href={card.href} target="_blank" rel="noopener noreferrer" class="card">
						<div class="card-name">{card.name}</div>
						<div class="card-desc">{locale === 'ja' ? card.descJa : card.desc}</div>
						<div class="card-url">{card.url}</div>
					</a>
				{/each}
			</div>
		</section>

		<section>
			<h2>{t.about.references}</h2>
			<div class="cards">
				{#each references as card}
					<a href={card.href} target="_blank" rel="noopener noreferrer" class="card">
						<div class="card-name">{card.name}</div>
						<div class="card-desc">{locale === 'ja' ? card.descJa : card.desc}</div>
						<div class="card-url">{card.url}</div>
					</a>
				{/each}
			</div>
		</section>

		<section>
			<h2>{locale === 'ja' ? '関連組織' : 'Related Organisations'}</h2>
			<div class="cards">
				{#each relatedOrgs as card}
					<a href={card.href} target="_blank" rel="noopener noreferrer" class="card">
						<div class="card-name">{card.name}</div>
						<div class="card-desc">{locale === 'ja' ? card.descJa : card.desc}</div>
						<div class="card-url">{card.url}</div>
					</a>
				{/each}
			</div>
		</section>

		<section>
			<h2>{locale === 'ja' ? '作者' : 'Author'}</h2>
			<div class="cards">
				{#each authors as card}
					<a href={card.href} target="_blank" rel="noopener noreferrer" class="card">
						<div class="card-name">{card.name}</div>
						<div class="card-desc">{locale === 'ja' ? card.descJa : card.desc}</div>
						<div class="card-url">{card.url}</div>
					</a>
				{/each}
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
		scrollbar-width: thin;
		scrollbar-color: rgba(58, 93, 120, 0.5) transparent;
	}
	.view::-webkit-scrollbar {
		width: 4px;
	}
	.view::-webkit-scrollbar-track {
		background: transparent;
	}
	.view::-webkit-scrollbar-thumb {
		background: rgba(58, 93, 120, 0.5);
		border-radius: 2px;
	}
	.view::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 212, 255, 0.4);
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
