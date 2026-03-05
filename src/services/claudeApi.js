const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'

const callClaude = async ({ system, messages, maxTokens = 1000, temperature }) => {
  const body = { model: MODEL, max_tokens: maxTokens, system, messages }
  if (temperature !== undefined) body.temperature = temperature
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
  return response.json()
}

export default callClaude
