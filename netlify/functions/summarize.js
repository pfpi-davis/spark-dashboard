// netlify/functions/summarize.js
import { GoogleGenerativeAI } from '@google/generative-ai'

export const handler = async function (event, context) {
  // 1. Security Check: Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body)
    const title = body.title
    // CRITICAL FIX: Look for 'text' OR 'summary'
    const text = body.text || body.summary

    if (!text && !title) {
      console.error('Missing input:', body)
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing text/summary or title' }) }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

    // 4. The Prompt
    const prompt = `
      You are a policy analyst for an environmental advocacy group.
      Analyze the following article title and snippet.
      
      Title: "${title}"
      Snippet: "${text}"

      Please provide:
      1. A 1-sentence summary of the core news.
      2. A "Relevance Rating" for environmental advocacy (Low/Medium/High).
      3. A draft tweet (max 280 chars) sharing this news.

      Return the response as a JSON object with keys: "summary", "relevance", "tweet".
      Do NOT wrap in markdown code blocks.
    `

    // 5. Generate
    const result = await model.generateContent(prompt)
    const response = await result.response
    const jsonText = response
      .text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: jsonText,
    }
  } catch (error) {
    console.error('Summarize Function Failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate summary' }),
    }
  }
}
