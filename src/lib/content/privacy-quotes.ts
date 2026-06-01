export interface PrivacyQuote {
	text: string;
	author: string;
	source: string;
	lang: string;
	translations?: Record<string, string>;
}

export const PRIVACY_QUOTES: PrivacyQuote[] = [
	{
		text: "Arguing that you don't care about the right to privacy because you have nothing to hide is no different than saying you don't care about free speech because you have nothing to say.",
		author: 'Edward Snowden',
		source: 'Reddit AMA, r/IAmA, May 21 2015',
		lang: 'en',
		translations: {
			ja: '隠すことが何もないからプライバシーの権利を気にしないと言うのは、言いたいことが何もないから言論の自由を気にしないと言うのと何ら変わりない。'
		}
	},
	{
		text: 'No system of mass surveillance has existed in any society that we know of to this point that has not been abused.',
		author: 'Edward Snowden',
		source: 'Interview, 2014',
		lang: 'en',
		translations: {
			ja: 'これまでに存在した大量監視システムで、乱用されなかったものは一つもない。'
		}
	},
	{
		text: 'Privacy is an inherent human right, and a requirement for maintaining the human condition with dignity and respect.',
		author: 'Bruce Schneier',
		source: '"The Eternal Value of Privacy", Wired, May 18 2006',
		lang: 'en',
		translations: {
			ja: 'プライバシーは人間に固有の権利であり、尊厳と敬意をもって人間としての状態を保つために不可欠な条件である。'
		}
	},
	{
		text: 'Data is a toxic asset. We need to start thinking about it as such, and treat it as we would any other source of toxicity.',
		author: 'Bruce Schneier',
		source: '"Data Is a Toxic Asset", CNN / schneier.com, March 1 2016',
		lang: 'en',
		translations: {
			ja: 'データは有毒な資産だ。そう認識し、他の有害物質と同様に扱い始める必要がある。'
		}
	},
	{
		text: 'The fact that we have military people relying on Tor, and human rights defenders relying on Tor, and everybody in between, is part of why it is safe for all of them.',
		author: 'Roger Dingledine',
		source: 'Interview, CloudFest Blog, December 2025',
		lang: 'en',
		translations: {
			ja: '軍の関係者がTorに依存し、人権活動家がTorに依存し、その間のあらゆる人がTorに依存しているという事実こそが、すべての人にとってTorが安全である理由の一つだ。'
		}
	},
	{
		text: 'I want a guarantee — with physics and mathematics, not with laws — that we can give ourselves real privacy of personal communications.',
		author: 'John Gilmore',
		source:
			'"Privacy, Technology, and the Open Society", First Conference on Computers, Freedom & Privacy, 1991',
		lang: 'en',
		translations: {
			ja: '法律ではなく、物理学と数学による保証が欲しい——個人の通信に真のプライバシーをもたらすことができるという保証が。'
		}
	},
	{
		text: 'The Net interprets censorship as damage and routes around it.',
		author: 'John Gilmore',
		source: 'Quoted in TIME Magazine, December 6 1993',
		lang: 'en',
		translations: {
			ja: 'ネットは検閲をダメージとして解釈し、それを迂回するルートを構築する。'
		}
	},
	{
		text: 'Privacy matters; privacy is what allows us to determine who we are and who we want to be.',
		author: 'Edward Snowden',
		source: 'Permanent Record, Macmillan Publishers, 2019',
		lang: 'en',
		translations: {
			ja: 'プライバシーは重要だ。プライバシーこそが、自分が何者であり、何者になりたいかを決める権利を与えてくれるものだ。'
		}
	},
	{
		text: 'Privacy is necessary for an open society in the electronic age.',
		author: 'Eric Hughes',
		source: "A Cypherpunk's Manifesto, March 9 1993",
		lang: 'en',
		translations: {
			ja: '電子時代の開かれた社会には、プライバシーが不可欠である。'
		}
	},
	{
		text: 'Privacy is the power to selectively reveal oneself to the world.',
		author: 'Eric Hughes',
		source: "A Cypherpunk's Manifesto, March 9 1993",
		lang: 'en',
		translations: {
			ja: 'プライバシーとは、自分自身を世界に対して選択的に明かす力である。'
		}
	},
	{
		text: 'We must defend our own privacy if we expect to have any.',
		author: 'Eric Hughes',
		source: "A Cypherpunk's Manifesto, March 9 1993",
		lang: 'en',
		translations: {
			ja: 'プライバシーを持ちたいなら、私たちは自らのプライバシーを自分たちで守らなければならない。'
		}
	},
	{
		text: 'Cypherpunks write code.',
		author: 'Eric Hughes',
		source: "A Cypherpunk's Manifesto, March 9 1993",
		lang: 'en',
		translations: {
			ja: 'サイファーパンクはコードを書く。'
		}
	},
	{
		text: 'Anonymity is a shield from the tyranny of the majority.',
		author: 'John Paul Stevens',
		source: 'McIntyre v. Ohio Elections Commission, U.S. Supreme Court, 1995',
		lang: 'en',
		translations: {
			ja: '匿名性は、多数派の専制から身を守る盾である。'
		}
	},
	{
		text: 'No one shall be subjected to arbitrary interference with his privacy, family, home or correspondence.',
		author: 'United Nations',
		source: 'Universal Declaration of Human Rights, Article 12, 1948',
		lang: 'en',
		translations: {
			ja: '何人も、自己の私事、家族、家庭若しくは通信に対して、ほしいままに干渉されることはない。'
		}
	},
	{
		text: 'The right to be let alone — the most comprehensive of rights.',
		author: 'Louis Brandeis',
		source: 'Olmstead v. United States, dissenting opinion, 1928',
		lang: 'en',
		translations: {
			ja: '放っておいてもらう権利——最も包括的な権利。'
		}
	},
	{
		text: 'Code is law.',
		author: 'Lawrence Lessig',
		source: 'Code and Other Laws of Cyberspace, 1999',
		lang: 'en',
		translations: {
			ja: 'コードは法である。'
		}
	},
	{
		text: 'We fight every day for everyone to have private access to an uncensored internet.',
		author: 'The Tor Project',
		source: 'Tor Project History / About page',
		lang: 'en',
		translations: {
			ja: '私たちは、すべての人が検閲されないインターネットへ私的にアクセスできるよう、日々闘っている。'
		}
	}
];

export function quoteTranslation(quote: PrivacyQuote, locale: string): string | null {
	return locale !== quote.lang ? (quote.translations?.[locale] ?? null) : null;
}

export function pickQuote(
	quotes: PrivacyQuote[],
	random: () => number = Math.random
): PrivacyQuote {
	return quotes[Math.floor(random() * quotes.length)] ?? quotes[0];
}
