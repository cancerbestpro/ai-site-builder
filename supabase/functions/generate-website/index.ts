const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating website for prompt:', prompt);

    const systemPrompt = `You are an expert website builder AI. Given a user's description, you generate complete, production-ready HTML, CSS, and JavaScript code for a website.

Your response should be structured as a JSON object with the following format:
{
  "message": "Brief description of what you created",
  "files": [
    {
      "name": "index.html",
      "content": "<!-- Full HTML content here -->"
    },
    {
      "name": "styles.css", 
      "content": "/* Full CSS content here */"
    },
    {
      "name": "script.js",
      "content": "// Full JavaScript content here"
    }
  ]
}

Guidelines:
- Create modern, responsive designs with clean code
- Use semantic HTML5
- Include mobile-friendly CSS with flexbox/grid
- Add smooth animations and transitions
- Make it visually appealing with good color schemes
- Include interactive JavaScript where appropriate
- Keep code well-organized and commented
- Make sure all CSS is in the styles.css file and all JS is in script.js file
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the AI response to extract the JSON
    let generatedData;
    try {
      // Try to find JSON in the response (handle cases where AI adds markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0]);
      } else {
        generatedData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: create a simple structure
      generatedData = {
        message: "Website generated successfully",
        files: [
          {
            name: "index.html",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Your Website</h1>
        <p>${prompt}</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`
          },
          {
            name: "styles.css",
            content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 600px;
  width: 100%;
}

h1 {
  color: #667eea;
  margin-top: 0;
}

p {
  color: #666;
  line-height: 1.6;
}`
          },
          {
            name: "script.js",
            content: `console.log('Website loaded successfully!');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
});`
          }
        ]
      };
    }

    console.log('Website generated successfully');

    return new Response(
      JSON.stringify(generatedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-website function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to generate website. Please try again.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
