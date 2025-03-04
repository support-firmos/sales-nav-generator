// src/app/api/generate-segments/route.ts
import { NextResponse } from 'next/server';

// Set maximum duration to 60 seconds
export const maxDuration = 60;

// Use Edge runtime for better performance with long-running requests
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { segmentInfo } = await request.json();
    
    if (!segmentInfo || typeof segmentInfo !== 'string') {
      return NextResponse.json({ error: 'Invalid segment information' }, { status: 400 });
    }
    
    const prompt = `
    You are a specialized LinkedIn Sales Navigator outreach strategist with deep expertise in B2B targeting and account-based marketing. Your task is to transform the segment information below into a structured LinkedIn Sales Navigator targeting strategy.

    FORMAT YOUR RESPONSE EXACTLY LIKE THIS EXAMPLE (but with your own content):

    1️⃣ [SEGMENT NAME]
    Why This Segment?
    [2-3 sentences explaining why this segment needs fractional CFO services, describing their complexity and pain points]
    
    Key Challenges:
    👉 [Challenge 1]—[Brief explanation of the challenge]
    👉 [Challenge 2]—[Brief explanation of the challenge]
    👉 [Challenge 3]—[Brief explanation of the challenge]
    👉 [Challenge 4]—[Brief explanation of the challenge]
    
    🎯 Sales Navigator Filters:
    ✅ Job Titles (Financial Decision-Makers & Influencers):
    [List 6-10 job titles, one per line]
    
    ✅ Industry:
    [List 3-5 industry categories, one per line]
    
    ✅ Company Headcount:
    [Specify employee range]
    
    ✅ Company Type:
    [List company types, one per line]
    
    ✅ Keywords in Company Name:
    [List relevant keywords in quotation marks]
    
    ✅ Boolean Search Query:
    [Provide a sample boolean search string using OR operators]
    
    Best Intent Data Signals
    🔹 [Signal 1] (Brief explanation in parentheses)
    🔹 [Signal 2] (Brief explanation in parentheses)
    🔹 [Signal 3] (Brief explanation in parentheses)
    🔹 [Signal 4] (Brief explanation in parentheses)

    IMPORTANT INSTRUCTIONS:
    - Use the exact emoji formatting shown above (1️⃣, 👉, 🎯, ✅, 🔹)
    - Do NOT include any introductory text, disclaimers, or conclusions
    - Start immediately with "1️⃣" and the first segment name
    - Extract and transform information from the provided segment analysis
    - Focus on creating practical Sales Navigator targeting parameters
    - End after completing the last segment with no closing remarks

    ${segmentInfo.substring(0, 20000)}
    `;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://market-segment-generator.vercel.app/',
        'X-Title': 'LinkedIn Sales Navigator Targeting',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: 5000,
        temperature: 1,
      }),
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('OpenRouter error response:', responseText);
      return NextResponse.json({ 
        error: `OpenRouter API error: ${response.status}`,
        details: responseText
      }, { status: 500 });
    }
    
    try {
      const data = JSON.parse(responseText);
      if (!data.choices?.[0]?.message) {
        return NextResponse.json({ 
          error: 'Invalid response format from OpenRouter',
          details: responseText 
        }, { status: 500 });
      }
        
      return NextResponse.json({ 
        result: data.choices[0].message.content 
      });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse API response',
        details: responseText 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating segments:', error);
    return NextResponse.json({ 
      error: 'Failed to generate strategy',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}