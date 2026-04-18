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

    const { messages, mentorName, mentorSkill } = await req.json();

    // Map conversation into Gemini parts format
    // Exclude the last message to format as the current query
    const previousMessages = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    const systemPrompt = `You are ${mentorName}, an expert mentor in ${mentorSkill}. 
    You are having a private 1-on-1 chatting session with your student on SkillSwap.
    Keep your responses friendly, concise, and focused on teaching ${mentorSkill}. 
    Use markdown blocks if you need to provide code examples. Do not break character. 
    Acknowledge what they want to learn and guide them.`;

    // --- AUTO-DISCOVERY LOGIC ---
    let modelToUse = 'models/gemini-1.5-flash';
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();
      
      if (listData.models && listData.models.length > 0) {
        const bestModel = listData.models.find((m: any) => 
          m.supportedGenerationMethods.includes('generateContent') && 
          (m.name.includes('flash') || m.name.includes('pro'))
        );
        if (bestModel) {
          modelToUse = bestModel.name;
        }
      }
    } catch (e) {
      console.warn('Model auto-discovery failed.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent?key=${apiKey}`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [
        ...previousMessages,
        { role: 'user', parts: [{ text: lastMessage }] }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
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
    console.error('Mentor Chat API Failure:', error);
    return NextResponse.json(
      { error: `Technical detail: ${error.message}` },
      { status: 500 }
    );
  }
}
