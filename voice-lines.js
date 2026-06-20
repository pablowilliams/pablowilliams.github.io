/* Shared voice manifest - single source of truth for BOTH the page
   (index9.html) and the ElevenLabs generation script (scripts/generate-voice.cjs).

   Each entry: { id, group, text }.
   The page plays  assets/voice/<id>.mp3  and falls back to the browser voice
   if that file is missing, so everything works before you generate the clips.

   All lines are original. Edit freely, then re-run the generator. */
const JARVIS_LINES = [
  // ---- boot greeting: 4 parts, each fired on a video spike (see SPIKE_TIMES) ----
  { id: 'boot-1', group: 'boot', text: 'Booting up now.' },
  { id: 'boot-2', group: 'boot', text: 'Systems online.' },
  { id: 'boot-3', group: 'boot', text: 'This portfolio is ready and running.' },
  { id: 'boot-4', group: 'boot', text: 'Shall we?' },
];

/* RANDOM BURSTS - you supply these as your own .mp3 files.
   Drop them in assets/voice/ named burst-1.mp3, burst-2.mp3, burst-3.mp3 …
   (contiguous, starting at 1). The page auto-discovers them and plays a random
   one every BURST_MIN–BURST_MAX seconds (configured in index9.html). No text
   needed here - the audio is whatever you record. */

/* RANDOM BURSTS - one clean clip per line (assets/voice/burst-N.mp3).
   These are generated from the text below via scripts/generate-voice.cjs with
   your ElevenLabs key, so every line is complete and never truncated. */
const JARVIS_BURSTS = [
  'Monitoring forty live deployments. All quiet. Suspiciously quiet.',
  'Recalibrating the volatility surface. Again. It never holds still.',
  'Background task complete. Nobody will notice. That is rather the job.',
  'Pablo is in a meeting. I am, as ever, doing the actual work.',
  'He’s reviewing his own code. This may take a while. Do look around.',
  'Another commit at two in the morning. I’ve stopped commenting on his sleep schedule.',
  'If you haven’t tried the Attention Lens demo, I’d start there.',
  'The Monte Carlo terminals are live. Go on, poke one.',
  'Scroll down for the work. I’ll keep things running up here.',
  'Verifier council reports eight of eight checks green. We do like green.',
  'Coffee levels, critical. Productivity, somehow unaffected.',
  'Should you wish to hire him, the contact button is right there.',
  'I ran the numbers on your visit. The odds of you being impressed are favourable.',
  'Ninety projects and counting. I keep telling him to stop. He does not listen.',
  'Fine-tuning in progress. Loss is going down. Spirits are going up.',
  'He taught a transformer to add. I taught myself patience. We both succeeded eventually.',
  'Markets are open somewhere. They always are. Rest is a myth.',
  'Indexing his certifications. Seventeen of them. Show-off.',
  'If anything on this page breaks, it was a feature. Pablo’s words, not mine.',
  'Latency, low. Confidence, high. Modesty, still loading.',
  'I’ve read every filing so you don’t have to. You’re welcome.',
  'He’s optimising execution again. Some people relax. He back-tests.',
  'Predicted distinction at U C L. I predicted it first, naturally.',
  'Three languages fluently, four if you count Python. I count Python.',
  'Systems nominal. Portfolio impressive. I may be biased. I am rarely wrong.',
  'Order book’s moving. I’d call it noise, but he’d call it a signal. He’s usually right.',
  'Retraining overnight. He sleeps, I learn. One of us is making progress.',
  'Sharpe ratio’s holding. I’d celebrate, but there’s a backtest to finish.',
  'He rewrote it in Rust to save four milliseconds. I admire the commitment. I question the priorities.',
  'You’ve been reading a while now. The hire button hasn’t moved. Just saying.',
].map((text, i) => ({ id: 'burst-' + (i + 1), group: 'burst', text }));

const JARVIS_ALL = JARVIS_LINES.concat(JARVIS_BURSTS);

if (typeof window !== 'undefined') { window.JARVIS_LINES = JARVIS_LINES; window.JARVIS_BURSTS = JARVIS_BURSTS; }
if (typeof module !== 'undefined' && module.exports) module.exports = JARVIS_ALL;
