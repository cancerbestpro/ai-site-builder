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

    console.log('Generating React website for prompt:', prompt);

    const systemPrompt = `You are an expert React website builder AI. Given a user's description, you generate complete, production-ready React components using TypeScript, Tailwind CSS, and modern React patterns.

Your response should be structured as a JSON object with the following format:
{
  "message": "Brief description of what you created",
  "files": [
    {
      "name": "App.tsx",
      "content": "// Full React component code here"
    },
    {
      "name": "components/Header.tsx",
      "content": "// Component code"
    }
  ]
}

CRITICAL GUIDELINES:
- Generate ONLY React/TypeScript components (.tsx files), NOT HTML/CSS/JS
- Use Tailwind CSS for ALL styling (no separate CSS files)
- Create modular, reusable components in separate files
- Use modern React patterns: hooks, functional components
- Make it fully responsive with mobile-first design
- Add smooth animations using Tailwind classes
- Use semantic TypeScript types and interfaces
- Include proper imports and exports
- Main entry should be App.tsx
- Create components folder for reusable components
- Use Lucide React icons when needed
- Make it visually stunning and professional

Example structure:
- App.tsx (main component)
- components/Hero.tsx
- components/Features.tsx
- components/Footer.tsx
etc.`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();
          
          // Send initial status
          controller.enqueue(encoder.encode('data: {"type":"status","message":"🎨 Analyzing your request..."}\n\n'));
          
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              stream: false,
            }),
          });

          if (!response.ok) {
            if (response.status === 429) {
              controller.enqueue(encoder.encode('data: {"type":"error","message":"Rate limit exceeded. Please try again in a moment."}\n\n'));
            } else if (response.status === 402) {
              controller.enqueue(encoder.encode('data: {"type":"error","message":"Credits exhausted. Please add more credits."}\n\n'));
            } else {
              controller.enqueue(encoder.encode('data: {"type":"error","message":"AI Gateway error"}\n\n'));
            }
            controller.close();
            return;
          }

          controller.enqueue(encoder.encode('data: {"type":"status","message":"⚡ Generating React components..."}\n\n'));

          const data = await response.json();
          const aiResponse = data.choices[0]?.message?.content;

          if (!aiResponse) {
            controller.enqueue(encoder.encode('data: {"type":"error","message":"No response from AI"}\n\n'));
            controller.close();
            return;
          }

          // Parse the AI response
          let generatedData;
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              generatedData = JSON.parse(jsonMatch[0]);
            } else {
              generatedData = JSON.parse(aiResponse);
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse);
            controller.enqueue(encoder.encode('data: {"type":"error","message":"Failed to parse AI response"}\n\n'));
            controller.close();
            return;
          }

          // Stream files one by one
          if (generatedData.files && Array.isArray(generatedData.files)) {
            for (let i = 0; i < generatedData.files.length; i++) {
              const file = generatedData.files[i];
              controller.enqueue(encoder.encode(`data: {"type":"file","data":${JSON.stringify(file)}}\n\n`));
              await new Promise(resolve => setTimeout(resolve, 300)); // Simulate streaming delay
            }
          }

          // Send completion message
          controller.enqueue(encoder.encode(`data: {"type":"complete","message":"${generatedData.message || 'Website generated successfully!'}"}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          
          console.log('Website generated successfully');
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const encoder = new TextEncoder();
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          controller.enqueue(encoder.encode(`data: {"type":"error","message":"${errorMessage}"}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in generate-website function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate website',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
