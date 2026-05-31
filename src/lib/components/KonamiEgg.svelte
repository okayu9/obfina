<script lang="ts">
  const SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];

  const QUOTES: { text: string; author: string; source: string }[] = [
    {
      text: "Arguing that you don't care about the right to privacy because you have nothing to hide is no different than saying you don't care about free speech because you have nothing to say.",
      author: "Edward Snowden",
      source: "Reddit AMA, r/IAmA, May 21 2015"
    },
    {
      text: "No system of mass surveillance has existed in any society that we know of to this point that has not been abused.",
      author: "Edward Snowden",
      source: "Interview, 2014"
    },
    {
      text: "Privacy is an inherent human right, and a requirement for maintaining the human condition with dignity and respect.",
      author: "Bruce Schneier",
      source: "\"The Eternal Value of Privacy\", Wired, May 18 2006"
    },
    {
      text: "Data is a toxic asset. We need to start thinking about it as such, and treat it as we would any other source of toxicity.",
      author: "Bruce Schneier",
      source: "\"Data Is a Toxic Asset\", CNN / schneier.com, March 1 2016"
    },
    {
      text: "The fact that we have military people relying on Tor, and human rights defenders relying on Tor, and everybody in between, is part of why it is safe for all of them.",
      author: "Roger Dingledine",
      source: "Interview, CloudFest Blog, December 2025"
    },
    {
      text: "I want a guarantee — with physics and mathematics, not with laws — that we can give ourselves real privacy of personal communications.",
      author: "John Gilmore",
      source: "\"Privacy, Technology, and the Open Society\", First Conference on Computers, Freedom & Privacy, 1991"
    },
    {
      text: "The Net interprets censorship as damage and routes around it.",
      author: "John Gilmore",
      source: "Quoted in TIME Magazine, December 6 1993"
    },
    {
      text: "Privacy matters; privacy is what allows us to determine who we are and who we want to be.",
      author: "Edward Snowden",
      source: "Permanent Record, Macmillan Publishers, 2019"
    },
  ];

  let visible = $state(false);
  let quote = $state(QUOTES[0]);
  let progress = $state(0);

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
  <div class="overlay" onclick={() => { visible = false; }} role="dialog" aria-modal="true">
    <div class="card">
      <div class="quote">"{quote.text}"</div>
      <div class="attr">
        <span class="author">— {quote.author}</span>
        <span class="source">{quote.source}</span>
      </div>
      <div class="hint">press any key to dismiss</div>
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
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
