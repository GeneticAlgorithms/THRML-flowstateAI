/**
 * Vercel Serverless Function to proxy Claude API requests
 * This avoids CORS issues when calling Anthropic's API from the browser
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.PUBLIC_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Claude API key not configured' });
    }

    try {
        const { messages, system, model, max_tokens } = req.body;

        // Call Anthropic API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model || 'claude-3-haiku-20240307',
                max_tokens: max_tokens || 200,
                messages: messages || [],
                system: system || ''
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                error: errorData.error?.message || `HTTP ${response.status}`
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('[Claude Proxy] Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
}

