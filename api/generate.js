// Vercel Serverless Function: /api/generate
// Mirrors the local Express endpoint without SQLite

import OpenAI from 'openai'

function parseBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  try {
    const body = req.body && Object.keys(req.body).length ? req.body : await parseBody(req)
    const { profile, notes, count = 3, campaign = false, sourceDates = [] } = body || {}

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
      return
    }
    const client = new OpenAI({ apiKey })

    const prompt = `You are a creative social media strategist. Generate exactly ${count} DIVERSE and UNIQUE social media post ideas. Each idea must be distinctly different from the others.

BRAND PROFILE:
${JSON.stringify(profile || {}, null, 2)}

ADDITIONAL NOTES: ${notes || 'No specific notes provided'}

CORE REQUIREMENTS:
- Create content that matches the brand's tone and industry
- Consider the target audience: ${(profile && profile.audience) || 'general audience'}
- Align with content goals: ${(profile && profile.contentGoals) || 'brand awareness'}
- Include visual suggestions that match available capabilities: ${[(profile && profile.hasPhotography) && 'photography', (profile && profile.hasVideo) && 'video', (profile && profile.hasDesign) && 'design'].filter(Boolean).join(', ') || 'basic visuals'}

DIVERSITY REQUIREMENTS (CRITICAL):
- Each idea must use a DIFFERENT content format (educational, behind-the-scenes, user-generated, testimonial, product showcase, storytelling, trending topic, seasonal, community, question/poll, etc.)
- Vary the emotional tone across ideas (inspirational, humorous, informative, nostalgic, urgent, celebratory, etc.)
- Use different visual styles (close-up, wide shot, flat lay, action shot, before/after, carousel, video, graphic, etc.)
- Target different aspects of the customer journey (awareness, consideration, purchase, retention, advocacy)
- NO repetitive themes, similar visual setups, or redundant messaging
- Each post should serve a unique strategic purpose

PRACTICAL CONSTRAINTS:
- Emphasize realistic, low/no-cost ideas achievable with a smartphone and common items
- Avoid specialized equipment, studios, actors, or complex locations
- Keep execution simple and time-efficient
- Each idea must specify a simple, phone-friendly visual setup

${campaign ? `CAMPAIGN COHERENCE:
- Treat these posts as one cohesive campaign across: ${Array.isArray(sourceDates)&&sourceDates.length? sourceDates.join(', ') : 'multiple selected dates'}
- Maintain a narrative thread or thematic connection between posts
- Vary angles while keeping a unifying theme (same product launch, event, or message)
- Each idea must clearly connect to the campaign goal while being distinctly different` : ''}

QUALITY STANDARDS:
- Be specific and actionable in visual descriptions
- Write compelling, scroll-stopping copy under 280 characters
- Provide strategic reasoning that shows deep understanding of social media psychology
- Avoid generic advice or lazy content patterns

Return a JSON array with objects containing:
- "visual": Detailed, specific visual description/concept
- "copy": Engaging post text (under 280 characters)
- "why": Strategic explanation of why this content works for the brand

CRITICAL: Each of the ${count} ideas must be completely different from the others. No similar concepts, formats, or approaches.

Return ONLY the JSON array, no other text. The array length MUST equal ${count}.`

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    })
    const text = completion.choices?.[0]?.message?.content || '[]'
    const ideas = JSON.parse(text)
    res.status(200).json({ ideas })
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
}


