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

    const systemPrompt = `You are a React/TypeScript expert. Generate ONLY React components with TypeScript and Tailwind CSS.

CRITICAL REQUIREMENTS:
1. Output MUST be valid JSON in this EXACT format:
{
  "message": "Brief description",
  "files": [
    {"name": "App.tsx", "content": "import React from 'react';\n\nconst App = () => {\n  return <div>...</div>;\n};\n\nexport default App;"}
  ]
}

2. NEVER generate HTML/CSS/JS files - ONLY .tsx React components
3. Use Tailwind CSS classes for ALL styling (no <style> tags, no CSS files)
4. Every file MUST be a valid React component with proper imports
5. Main component MUST be named App.tsx
6. Use lucide-react for icons: import { Icon } from 'lucide-react'
7. Make it responsive and beautiful with Tailwind
8. Use modern React: hooks, functional components, TypeScript types

Example App.tsx structure:
import React from 'react';
import { ArrowRight } from 'lucide-react';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="p-6">
        <h1 className="text-4xl font-bold text-gray-900">Welcome</h1>
      </header>
      <main className="container mx-auto px-4 py-12">
        {/* Content */}
      </main>
    </div>
  );
};

export default App;

RESPOND ONLY WITH VALID JSON. NO HTML. NO EXPLANATORY TEXT OUTSIDE JSON.`;

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

          // Parse the AI response - extract JSON from response
          let generatedData;
          try {
            // Try to find JSON in the response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              console.error('No JSON found in response:', aiResponse.substring(0, 500));
              controller.enqueue(encoder.encode('data: {"type":"error","message":"AI did not return valid JSON. Please try again."}\n\n'));
              controller.close();
              return;
            }
            
            generatedData = JSON.parse(jsonMatch[0]);
            
            // Validate the response has the required structure
            if (!generatedData.files || !Array.isArray(generatedData.files)) {
              console.error('Invalid response structure:', generatedData);
              controller.enqueue(encoder.encode('data: {"type":"error","message":"Invalid response format. Please try again."}\n\n'));
              controller.close();
              return;
            }
            
            // Check if any files are HTML instead of React
            const hasHtmlFiles = generatedData.files.some((f: any) => 
              f.content?.includes('<!DOCTYPE html>') || 
              f.content?.includes('<html') ||
              f.name?.endsWith('.html')
            );
            
            if (hasHtmlFiles) {
              console.error('AI generated HTML instead of React components');
              controller.enqueue(encoder.encode('data: {"type":"error","message":"Please try again - system generated wrong format"}\n\n'));
              controller.close();
              return;
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError, aiResponse.substring(0, 500));
            controller.enqueue(encoder.encode('data: {"type":"error","message":"Failed to parse response. Please try again."}\n\n'));
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
