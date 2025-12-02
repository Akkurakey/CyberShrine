
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FALLBACK_FORTUNES } from "../constants";

export const generateFortune = async (): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API Key found, using fallback fortune.");
    return getRandomFallback();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        chinese: {
          type: Type.STRING,
          description: "The fortune message in Chinese. VERY short, 4-8 characters. Zen, Daoist, or ancient philosophical style.",
        },
        english: {
          type: Type.STRING,
          description: "The English translation. Short, poetic, philosophical. Max 10 words.",
        },
      },
      required: ["chinese", "english"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a very short, Zen-like, philosophical fortune stick message. Style: Daoist, minimalist, like 'The usefulness of the useless' or 'Still water runs deep'. Avoid generic advice. Be poetic.",
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 1.1, 
      }
    });

    const jsonText = response.text?.trim();
    if (!jsonText) throw new Error("No text generated");
    
    const result = JSON.parse(jsonText);
    return `${result.chinese}\n${result.english}`;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return getRandomFallback();
  }
};

export const regenerateDivineImage = async (imageBase64: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing. Ensure you have selected a key or set the API_KEY environment variable.");
    return imageBase64;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Dynamically detect mime type
    const matches = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      console.warn("Invalid image format, returning original.");
      return imageBase64;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Upgrade to gemini-3-pro-image-preview for high quality generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: mimeType, 
              data: base64Data 
            } 
          },
          { 
            text: "Extract the main subject from this image and place it on a pure black background. Keep the original aspect ratio and shape of the subject exactly as is. Apply a mystical, dark golden metal texture to the subject to make it look like a sacred artifact. Do not crop the subject." 
          }
        ]
      },
      config: {
         // Explicitly requesting image generation
         imageConfig: {
             aspectRatio: "1:1" // Maintain 1:1 for the shrine focal point if possible, or matches input implicitly
         }
      }
    });

    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    return imageBase64; // Fallback to original if no image generated
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return imageBase64;
  }
};

const getRandomFallback = () => {
  return FALLBACK_FORTUNES[Math.floor(Math.random() * FALLBACK_FORTUNES.length)];
};
