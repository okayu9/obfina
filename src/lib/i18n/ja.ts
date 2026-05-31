import type { Messages } from './en';

export const ja: Messages = {
	// Navigation labels
	nav: {
		map: 'マップ',
		mapDesc: '国別リレー',
		hosting: 'ホスティング',
		hostingDesc: 'AS集中リスク',
		paths: 'パス',
		pathsDesc: 'パス選択の偏り',
		growth: '成長',
		growthDesc: 'キャパシティと使用量の推移',
		circuits: '回路',
		circuitsDesc: 'ライブ回路シミュレーション',
		about: 'このアプリについて',
		aboutDesc: 'データソースと参考文献',
		hint: '1–6 · ← →'
	},

	// Language switcher
	lang: {
		en: 'EN',
		ja: '日本語'
	},

	// Loading screen
	loading: {
		default: '読み込み中…',
		unavailable: 'リレーデータが利用できません',
		historical: '過去データが利用できません',
		metrics: 'Torメトリクス取得中…'
	},

	// Map view
	map: {
		relays: 'リレー',
		legendExit: 'シアン→緑 = 出口シェア',
		legendBrightness: '明るいほど = リレーが多い'
	},

	// Country panel
	countryPanel: {
		relays: 'リレー',
		moreDetails: '詳細を見る',
		showLess: '閉じる',
		networkBw: 'ネットワーク帯域',
		uniqueAs: 'ユニークAS',
		topProviders: '主要プロバイダー',
		relayList: 'リレー一覧',
		nickname: 'ニックネーム',
		bandwidth: '帯域幅',
		flags: 'フラグ',
		guard: 'ガード',
		guardDesc: 'エントリー — Torへの最初のホップ',
		middle: 'ミドル',
		middleDesc: 'ガードと出口の間でトラフィックを中継',
		exit: '出口',
		exitDesc: '最終ホップ — 宛先へ接続'
	},

	// Hosting / Centralization view
	hosting: {
		title: 'ホスティング集中度',
		description:
			'自律システム(AS)ごとのネットワーク占有率。曲線が右下に膨らむほど、少数のプロバイダーがトラフィックの大部分を担っています。ラインをドラッグするかプリセットを選んで、上位プロバイダー数を変更できます。プロバイダーをクリックするとリレー一覧を表示します。',
		allRelays: '全リレー',
		exitOnly: '出口のみ',
		giniAll: 'ジニ係数・全体',
		giniExit: 'ジニ係数・出口',
		heldByTop: '上位',
		of: '/',
		providers: 'プロバイダーが保有',
		top: 'トップ',
		all: '全',
		fewerAses: 'ASが少ない →',
		cumulativeShare: '↑ 累積シェア',
		moreProviders: 'その他',
		relays: 'リレー',
		bandwidthShare: '帯域シェア',
		consensusShare: 'コンセンサスシェア',
		nickname: 'ニックネーム',
		cc: 'CC',
		bandwidth: '帯域幅',
		flags: 'フラグ'
	},

	// Paths view
	paths: {
		title: 'パス選択の偏り',
		description:
			'Torはキャパシティに基づいてリレーを重み付けするため、少数の高帯域リレーがトラフィックの大部分を担います。ラインをドラッグするかプリセットを選んで確認できます。',
		ofTrafficRidesOn: 'のトラフィックが上位',
		ofRelays: 'のリレーに集中',
		giniConsensus: 'ジニ係数・コンセンサス重み',
		topRelays: '上位リレー →',
		shareOfTraffic: '↑ トラフィックシェア',
		legendConsensus: 'コンセンサス重み（パス選択）',
		legendGuard: 'ガードポジション',
		legendExit: '出口ポジション',
		legendEquality: '完全均等',
		top: 'トップ'
	},

	// Growth / Trends view
	growth: {
		title: 'ネットワークの推移',
		description:
			'リレーネットワークの成長、広告キャパシティと実際の使用量の差、そしてTorユーザーの接続元。出典: Torメトリクス。',
		runningRelays: '稼働中リレー',
		capacityUsed: '使用キャパシティ',
		advertised: '広告済み',
		consumed: '消費済み',
		relays: 'リレー',
		dailyUsers: '1日あたりのユーザー'
	},

	// Circuits view
	circuits: {
		title: 'ライブ回路',
		subtitle: 'ガード → ミドル → 出口、実際のリレーから選択重みでサンプリング',
		unknownAs: '不明なAS',
		guardLabel: 'ガード',
		middleLabel: 'ミドル',
		exitLabel: '出口'
	},

	// About view
	about: {
		title: 'データソースと参考文献',
		subtitle:
			'このビジュアライゼーションは、Torプロジェクトおよびネットワークリサーチコミュニティによるオープンデータを使用しています。',
		dataSources: 'データソース',
		references: '参考文献'
	},

	// Footer
	footer: {
		dataAsOf: 'データ取得時刻'
	}
};
