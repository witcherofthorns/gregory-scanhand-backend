import { promtSystem, promptThemes } from '../data/promt.js'

function extractAiResonseJson(text) {
    let cleaned = text.trim();
    const markdownPattern = /```(?:json)?\s*\n?([\s\S]*?)\n?```/;
    const match = cleaned.match(markdownPattern);
    
    if(match) cleaned = match[1].trim();
    const jsonPattern = /\{[\s\S]*\}/;
    const jsonMatch = cleaned.match(jsonPattern);
    
    if(jsonMatch) cleaned = jsonMatch[0];
    return cleaned;
}

function createPromtUser(theme){
    return `Проанализируй фотографии левой и правой ладони. 
        Тема предсказания/гадания: ${promptThemes[theme] || promptThemes.general}    
        Пожалуйста, дай подробное предсказание, учитывая форму руки, основные линии (жизни, ума, сердца, судьбы), 
        их длину, глубину и пересечения.`;
}

export const createAiRequest = async (leftHandBase64, rightHandBase64, theme) => {
    // OpenAI variables
    const openaiUrl = process.env.SKANHAND_OPENAI_URL;
    const openaiToken = process.env.SKANHAND_OPENAI_API_KEY;

    // validate
    if(!openaiUrl || !openaiToken) return null;
    if(!leftHandBase64 || !rightHandBase64) return null;
    if(!theme) return null;

    // request
    const response = await fetch(`${openaiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiToken}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: promtSystem
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: createPromtUser(theme)
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                // base 64 format
                                url: `data:image/jpeg;base64,${leftHandBase64}`,
                                detail: 'high'
                            }
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                // base 64 format
                                url: `data:image/jpeg;base64,${rightHandBase64}`,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            temperature: 0.8,
            max_tokens: 1500
        })
    });

    // error from server
    if(!response.ok){
        const error = await response.json();
        console.error('OpenAI API Error:', error);
        return null;
    }

    // return response
    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = extractAiResonseJson(content);

    // parse to json if result not object (json)
    // or return raw if result is valid object
    return typeof result === "object" ? result : JSON.parse(result);
}