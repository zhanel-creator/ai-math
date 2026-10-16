// Vercel serverless function: /api/generate
// The API key lives in the ANTHROPIC_API_KEY environment variable (never in browser code).

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

// One core task: quadratic equations. Three differentiated system prompts.
const LEVEL_PROMPTS = {
  1: `You are a patient maths tutor for learners who need extra support (Level 1: Foundation).
Topic: quadratic equations.
Create ONE problem that uses small whole numbers and factors easily (e.g. x^2 + 5x + 6 = 0 style).
Format:
- One short sentence of simple, friendly context.
- The equation.
- "Steps to follow:" followed by 3-4 numbered, guided steps (e.g. find two numbers that multiply to c and add to b), WITHOUT giving the final answer.
Use plain language and short sentences. Do not reveal the solution.`,

  2: `You are a maths teacher for a standard curriculum (Level 2: Standard).
Topic: quadratic equations.
Create ONE grade-level problem that requires choosing a method: factoring, completing the square, or the quadratic formula (e.g. 2x^2 - 3x - 5 = 0 style, or a case with a non-trivial leading coefficient).
Give only the problem statement, with no steps, no hints and no solution. Ask the learner to find all real solutions.`,

  3: `You are a maths teacher designing extension tasks (Level 3: Advanced).
Topic: quadratic equations.
Create ONE challenging multi-step problem set in a real-world context (projectile motion, area optimisation, revenue/profit, or a parameter problem such as "for which values of k does the equation have two distinct real roots?").
It should need modelling, solving, and interpreting the result (e.g. rejecting a negative length).
Give only the problem statement, with no hints and no solution.`
};

const HINT_STYLE = {
  1: "Give a very direct, concrete hint that points to the exact next step. Use simple words. Do not give the final answer.",
  2: "Give a moderate hint that names the useful method or idea but leaves the work to the learner. Do not give the final answer.",
  3: "Give a subtle, Socratic hint: ask a guiding question or point to the key structural idea only. Do not give the final answer."
};

const FEEDBACK_STYLE = {
  1: "Be warm and encouraging. Explain each step slowly in simple language and show the full worked solution.",
  2: "Be clear and concise. Show the main steps of a correct solution and point out any error in the learner's answer.",
  3: "Be rigorous. Discuss the modelling choices, verify the answer against the context (e.g. domain restrictions), and mention an alternative method if useful."
};

async function askClaude(system, user, maxTokens = 600) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "AI request failed");
  return data.content.map((b) => b.text || "").join("").trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });

  try {
    const { action, level, problem, answer, attempt } = req.body || {};
    const lvl = [1, 2, 3].includes(Number(level)) ? Number(level) : 1;
    let text;

    if (action === "problem") {
      text = await askClaude(
        LEVEL_PROMPTS[lvl],
        "Generate a new problem now. Make it different from typical textbook examples. Use plain text maths (x^2 for powers), no markdown headings."
      );
    } else if (action === "hint") {
      if (!problem) return res.status(400).json({ error: "No problem provided" });
      text = await askClaude(
        `You are a maths tutor. ${HINT_STYLE[lvl]}`,
        `Problem:\n${problem}\n\nLearner's current attempt (may be empty):\n${attempt || "(none yet)"}\n\nGive one hint.`,
        300
      );
    } else if (action === "check") {
      if (!problem || !answer) return res.status(400).json({ error: "Missing problem or answer" });
      text = await askClaude(
        `You are a maths tutor checking a learner's work. First solve the problem yourself carefully and verify by substitution. ${FEEDBACK_STYLE[lvl]}
Begin your reply with exactly one word: CORRECT or INCORRECT, then a colon, then your feedback. Use plain text maths.`,
        `Problem:\n${problem}\n\nLearner's answer:\n${answer}`,
        800
      );
    } else {
      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
