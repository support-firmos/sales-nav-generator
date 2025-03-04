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
    
    // Count number of segments (estimate) for the prompt
    const segmentCount = (segmentInfo.match(/\n\n/g) || []).length + 1;
    
    const prompt = `
    You are a specialized LinkedIn Sales Navigator outreach strategist with deep expertise in B2B targeting and account-based marketing. Your knowledge extends to market research industry segments, financial services needs, and executive decision-making patterns.
    
    Based on the market research segment information below, create a comprehensive LinkedIn Sales Navigator targeting strategy for each segment. Present your response in this exact format:

    For each segment, use numbered headings (e.g., "1. [SEGMENT NAME]") followed by:

    A. Geographic Parameters:
    * List 4-6 US states/regions where this segment has highest concentration

    B. Company Filters:
    * Industry: [specific classifications]
    * Company Size: [headcount range]
    * Revenue: [revenue range]
    * Growth Indicators: [specific metrics]
    * Company Type: [business entity types]

    C. Decision-Maker Positions:
    1. [Position 1]: [Title variations]
    2. [Position 2]: [Title variations]
    ... (include at least 20 positions)

    D. Advanced Intent/Behavioral Indicators:
    * [List 4-6 specific indicators]

    IMPORTANT INSTRUCTIONS:
    - Do NOT include any introductory text, disclaimers, or conclusions
    - Start immediately with the first segment heading
    - Do NOT include any notes or explanations outside the required format
    - Focus only on decision-makers who have authority to engage services (exclude internal finance roles)
    - End after completing the last segment - do not add any closing remarks
    - Be specific and actionable with all targeting parameters
    - Use bullet points exactly as shown in the format above

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