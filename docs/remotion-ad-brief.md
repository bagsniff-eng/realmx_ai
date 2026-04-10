# REALMxAI Video Ad Brief

## Goal

Create a short vertical product commercial for X that makes REALMxAI feel like a premium crypto-native operating layer, not just another dashboard.

Default target:
- Format: `1080x1920`
- Duration: `15s`
- Frame rate: `30fps`
- Delivery: organic X post first, X ad compatible

## Brand Inputs From The Codebase

- Product name: `REALMxAI`
- Logo asset: `public/le6jxytl.webp`
- Core palette:
  - `--color-realm-black: #0A0D10`
  - `--color-realm-surface: #0F1419`
  - `--color-realm-text-primary: #E6EDF3`
  - `--color-realm-text-secondary: #8B949E`
  - `--color-realm-cyan: #2FE6D2`
- Typography:
  - serif: `Fraunces`
  - sans: `Source Sans 3`
  - mono: `IBM Plex Mono`

## Product Signals Worth Featuring

Based on `src/App.tsx`, the strongest ad-worthy product beats are:
- node dashboard and live mining session state
- wallet verification and USDT approval flow
- rewards, point balance, and projected earnings
- task system tied to X, Discord, Telegram, GitHub, and wallet identity
- referral and profile-completion loops
- trust and identity framing instead of pure speculation

## Research Takeaways

### What current strong SaaS and crypto promos keep doing

- Open with movement immediately instead of a static logo card.
- Show the product in the first seconds, not just abstract brand visuals.
- Use very short text bursts with one message per beat.
- Animate real UI with layered depth, perspective, glow, and shadow to create a faux-3D premium feel.
- Use one camera move over a stacked composition instead of ten unrelated animations.
- End with a clean CTA or brand close before the viewer mentally checks out.

### Useful references

- Remotion homepage and README position Remotion as a React-based way to create real MP4 videos and highlight productized examples like Fireship and GitHub Unwrapped.
- X's current ad guidance recommends vertical `9:16`, keeping videos at `15s` or less, showing movement early, placing branding within the first `3s`, and accounting for viewer overlays in the opening seconds.
- Crypto motion references that feel closer to the target style often combine dark finance UI, high-contrast accent colors, chart motion, and layered 3D objects or pseudo-3D panels rather than flat screen recordings.

### Specific references reviewed

- Remotion README: https://github.com/remotion-dev/remotion/blob/main/README.md?plain=1
- Remotion homepage: https://www.remotion.dev/
- X Ads best practices: https://business.x.com/en/advertising/ads-best-practices
- X creative specs: https://business.x.com/en/help/campaign-setup/creative-ad-specifications
- X Vertical Video Ads: https://business.x.com/en/products/vertical-video-ads
- ROCANI / TOKIE crypto motion case study: https://rocani.studio/work/tokie
- MicrosaaS discussion on cinematic 3D promo patterns: https://www.reddit.com/r/microsaas/comments/1rxv56l/i_got_tired_of_spending_hours_in_after_effects_so/

## Recommended Creative Direction

### Direction name

`Dark Signal`

### Visual thesis

Treat the REALMxAI dashboard like a command surface inside a black, glassy, near-future control room. The UI should float in depth planes with cyan energy accents, subtle perspective tilts, and moving data streaks.

### Motion thesis

- Use faux-3D, not full cinematic 3D.
- Stack dashboard panels, wallet confirmations, mining stats, and task cards in depth.
- Drift the camera through the stack while panels rotate by `4-8deg` and settle with spring timing.
- Use thin cyan scan lines, light bloom, and soft blur to separate foreground and background.

### Copy thesis

Short, declarative, crypto-native:
- `Own the node.`
- `Verify identity.`
- `Mine rewards.`
- `Move through the network.`

Avoid overexplaining the whole platform in one pass.

## Proposed 15s Storyboard

### 0.0s - 1.4s

Black screen. Cyan signal line sweeps across. The REALMxAI logo extrudes from darkness with a sharp lateral parallax move.

On-screen text:
`REALMxAI`
`Own the node.`

### 1.4s - 3.5s

The logo breaks apart into layered UI planes. The dashboard flies in from depth. We reveal live mining status, points, and operator identity.

On-screen text:
`Your dashboard is live.`

### 3.5s - 6.5s

Camera tracks across wallet signature, USDT approval, and trust-link states. Use focus shifts between cards so the sequence feels dimensional.

On-screen text:
`Verify. Connect. Secure.`

### 6.5s - 10.5s

The scene widens into a stacked ecosystem view: mining, tasks, referrals, social actions, and reward readiness.

On-screen text:
`One node. Multiple reward loops.`

### 10.5s - 13.0s

Panels accelerate into a hero metrics wall. Numbers pulse, cyan highlights travel, and one clean earnings/progress stat becomes the focal point.

On-screen text:
`Built for network momentum.`

### 13.0s - 15.0s

Everything collapses into a centered logo lockup with a final dashboard silhouette behind it.

On-screen text:
`REALMxAI`
`Launch your node.`

## Production Notes For Remotion

- Build the ad as `5` scene components plus a shared camera/depth system.
- Keep logo treatment reusable so it can also become a shorter bumper.
- Use real app screenshots or recreations taken from the current UI, not generic placeholder dashboards.
- Keep captions and key text inside a central safe area because X overlays can cover the opening seconds.
- Add an export path for both `9:16` and `16:9`, but finish vertical first.

## Missing Assets To Capture Next

- full-page screenshots of dashboard, mining, tasks, referrals, wallet, and node views
- optional launch CTA URL or exact launch phrase
- optional voiceover decision: no VO, AI VO, or music-only

## Recommendation

Build the first version as a no-voice, music-led, vertical `15s` commercial with bold text overlays. That is the fastest route to something that can work on X and still feel premium.
