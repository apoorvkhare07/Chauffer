# Chauffeur: instructions for Codex

## Project context
- Chauffeur is a shopping assistant concept for women's clothing across Indian marketplaces, with WhatsApp and voice as planned channels.
- This repo currently contains a Vite + React marketing website at `/` and a separate shopping demo at `/demo/`. Keep them separate, linked pages with separate entry points.
- The demo uses eight fictional products. Orders, delivery, returns and preferences are simulated; state resets on reload. Live AI, store connections, payments, WhatsApp, voice and a backend are not connected.
- Do not invent customers, reviews, savings or availability claims, or describe planned capabilities as working integrations. Subscription pricing is undecided.
- Read `PRODUCT.md` for product scope, `DESIGN.md` and `design/` for design direction, and `README.md` for local setup. Preserve the modern design with its desi and Renaissance touches.

## Working with the builder
- Use plain words and short replies. Explain any technical term in the same sentence.
- Say what you are about to do in one line. Explain a skill, slash command or subagent the first time you use it.
- Ask one product question at a time with concrete choices. Decide routine technical details yourself.
- Investigate reported problems, fix them and check the result. Complete the requested work before handing back.
- Stay in scope, gently flag choices that would cause problems, and preserve unrelated changes.
- If a command fails, read the error, fix the cause and rerun. If the same failure happens twice, stop and explain the blocker plainly.
- Report what you actually checked; never claim a browser flow works without trying it. End with one useful next step.

## GrowthX context
- Keep the learning context practical: briefly explain decisions so the builder can understand and repeat them.
- No separate GrowthX requirements are documented here. Do not invent course requirements or deadlines.

## Build Sprint context
- The fixed stack is Codex for code, GitHub for source control, and Convex for database, backend functions, sign-in through Convex Auth, and static hosting.
- Do not introduce or suggest other hosting, database or authentication services. Ask first if a feature seems to require one.
- Use relevant skills in `../.agents/skills/`. For hosting, read and follow `../.agents/skills/convex-dev-static-hosting/SKILL.md`.
- Deployment means `npm run deploy` to a `.convex.site` address; pushing to GitHub does not deploy. This repo currently has no deploy script: inspect and complete the Convex hosting setup before deployment.

## Parent folder context
- Build Sprint workspace: `/Users/apoorvkhare/build-sprint-app`. Start fresh sessions there with `cdx`, then run Chauffeur commands from `chauffeur/`. If a fresh session starts elsewhere, remind the builder of that starting folder.
- Shared skills and their lock file live in `../.agents/` and `../skills-lock.json`. The parent also contains planning files, `design/`, `convex/` and `.env.local`; check their relevance before applying them to Chauffeur. Never expose environment secrets.
- `../saathi/` is a sibling app; do not change it for Chauffeur tasks. Chauffeur has its own Git repository, and the parent has another; check the repository root before Git actions.

## Local work and checks
- Website: `App.jsx`, `Offerings.jsx`, `VisualStories.jsx`, `main.jsx`, and their CSS files. Demo: `ShoppingDemo.jsx`, `demo/`, and `engine.js`. Assets: `public/`.
- Install with `npm install`; run with `npm run dev` (default port 5174; use the address Vite prints).
- For code changes, run `npm test` and `npm run build`. The build produces both pages in `dist/`.
- For visible or interactive changes, also open the app in a browser and check the affected page and behavior. Documentation-only edits need a content and diff check.
