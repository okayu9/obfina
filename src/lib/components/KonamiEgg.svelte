<script lang="ts">
	import { getLocale } from '$lib/i18n/index.svelte';

	const SEQUENCE = [
		'ArrowUp',
		'ArrowUp',
		'ArrowDown',
		'ArrowDown',
		'ArrowLeft',
		'ArrowRight',
		'ArrowLeft',
		'ArrowRight',
		'KeyB',
		'KeyA'
	];

	const QUOTES: {
		text: string;
		author: string;
		source: string;
		lang: string;
		translations?: Record<string, string>;
	}[] = [
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
		}
	];

	const locale = $derived(getLocale());

	let visible = $state(false);
	let quote = $state(QUOTES[0]);
	let progress = $state(0);

	const translation = $derived(
		locale !== quote.lang ? (quote.translations?.[locale] ?? null) : null
	);

	const hintText = $derived(locale === 'ja' ? '任意のキーで閉じる' : 'press any key to dismiss');

	function onKeydown(e: KeyboardEvent) {
		if (visible) {
			visible = false;
			progress = 0;
			return;
		}
		if (e.code === SEQUENCE[progress]) {
			progress++;
			if (progress === SEQUENCE.length) {
				quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
				visible = true;
				progress = 0;
			}
		} else {
			progress = e.code === SEQUENCE[0] ? 1 : 0;
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if visible}
	<div
		class="overlay"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={() => {
			visible = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				visible = false;
			}
		}}
	>
		<div class="card">
			<div class="quote">"{quote.text}"</div>
			{#if translation}
				<div class="quote translation">"{translation}"</div>
			{/if}
			<div class="attr">
				<span class="author">— {quote.author}</span>
				<span class="source">{quote.source}</span>
			</div>
			<div class="hint">{hintText}</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(4, 10, 18, 0.88);
		backdrop-filter: blur(4px);
		animation: fade-in 0.25s ease-out;
	}
	.card {
		max-width: 560px;
		padding: 2.5rem 3rem;
		border: 1px solid rgba(0, 212, 255, 0.25);
		border-radius: 8px;
		background: rgba(8, 20, 31, 0.95);
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
		text-align: center;
	}
	.quote {
		font-size: 1.05rem;
		line-height: 1.7;
		color: #e6f1ff;
		letter-spacing: 0.03em;
	}
	.quote.translation {
		font-size: 0.9rem;
		color: #9fc6e0;
		border-top: 1px solid rgba(58, 93, 120, 0.3);
		padding-top: 1rem;
	}
	.attr {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.author {
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		color: var(--accent-cyan);
	}
	.source {
		font-size: 0.62rem;
		letter-spacing: 0.08em;
		color: #3a5266;
		text-transform: uppercase;
	}
	.hint {
		font-size: 0.58rem;
		letter-spacing: 0.2em;
		color: #3a5266;
		text-transform: uppercase;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
