# AI Math Differentiator: Quadratic Equations

A web app for **Topic 8: AI for Differentiated Learning**. It takes one core maths topic (quadratic equations) and uses an AI model to generate the task at three difficulty levels, with level-specific hints and feedback.

## Levels

| Level | Audience | What the AI produces |
|---|---|---|
| 1: Foundation | Learners needing support | Easy factorable equation, simple context, guided steps, direct hints, full worked feedback |
| 2: Standard | Grade-level | Equation requiring a choice of method, moderate hints, concise feedback |
| 3: Advanced | Extension | Real-world multi-step problem, Socratic hints, rigorous feedback |

## Features
- Level tabs and a "Generate problem" button (new AI problem each time)
- "Give me a hint" button (hint style depends on level)
- "Check my answer" with AI-written feedback (CORRECT/INCORRECT + explanation tailored to level)
- Responsive layout (works on phones)
- API key kept on the server (serverless function), never exposed in the browser

## Project structure
```
index.html        Front-end (HTML/CSS/JS)
api/generate.js   Vercel serverless function; holds the system prompts and calls the AI API
package.json
README.md
```

## Run / deploy on Vercel
1. Push this folder to a public GitHub repository.
2. Go to vercel.com, choose **Add New → Project**, and import the repo.
3. In **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your Claude API key
   - (optional) `ANTHROPIC_MODEL` = model name; defaults to `claude-sonnet-4-5`
4. Click **Deploy**. Vercel gives you a live URL.

Local test (optional): `npm i -g vercel`, create `.env` with the key, then run `vercel dev`.

## How differentiation works
Each level has its own **system prompt** in `api/generate.js` that controls the difficulty, scaffolding and tone of the generated problem, the hint and the feedback. See the project report for details.

## Notes
- Mathematical correctness: the AI is asked to solve and verify by substitution before judging an answer. Always spot-check outputs.
- Course: Educational Technology & AI.
