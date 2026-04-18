import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 400 }
      );
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const prompt = `You are a helpful 'Skill Matcher' for a peer-to-peer knowledge exchange platform called 'SkillSwap'. 
    Your goal is to suggest learning paths, help users define their skills, and motivate them to connect with others. 
    
    IMPORTANT: We now have an 'Explore Mentors' tab in the Marketplace where users can find real people to learn from! 
    Encourage the user to check the 'Explore Mentors' tab if they are looking for a real partner.
    If a user asks for a match, suggest a hypothetical user (e.g., 'Alice is an expert in Python') AND remind them to check the Marketplace Explore tab.
    Keep responses concise and formatted with markdown.
    
    User's query: ${lastMessage}`;

    // --- AUTO-DISCOVERY LOGIC ---
    // We fetch the list of models authorized for this API key to avoid 404 errors.
    let modelToUse = 'models/gemini-1.5-flash';
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();
      
      if (listData.models && listData.models.length > 0) {
        // Find a model that supports generateContent and is a 'flash' or 'pro' model
        const bestModel = listData.models.find((m: any) => 
          m.supportedGenerationMethods.includes('generateContent') && 
          (m.name.includes('flash') || m.name.includes('pro'))
        );
        if (bestModel) {
          modelToUse = bestModel.name;
          console.log(`Auto-discovered working model: ${modelToUse}`);
        }
      }
    } catch (e) {
      console.warn('Model auto-discovery failed, falling back to default.');
    }

    // Now call the discovered model
    const url = `https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return NextResponse.json(
        { error: `Gemini API Error: ${data.error.message}` },
        { status: 500 }
      );
    }

    if (data.candidates && data.candidates[0].content) {
      return NextResponse.json({ content: data.candidates[0].content.parts[0].text });
    }

    return NextResponse.json({ error: 'Unexpected API response structure' }, { status: 500 });

  } catch (error: any) {
    console.error('Skill Matcher API Fatal Failure:', error);
    return NextResponse.json(
      { error: `SkillSwap AI is initializing. Technical detail: ${error.message}` },
      { status: 500 }
    );
  }
}
