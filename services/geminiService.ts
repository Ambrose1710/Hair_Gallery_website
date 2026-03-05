
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getStyleAdvice(description: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional hair stylist at "The Hair Gallery". A client is asking for advice: "${description}". Provide a warm, professional, and helpful response (max 150 words) recommending a style or service.`,
    });
    return response.text || "I'd love to help you find your perfect style! Please come in for a consultation.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Our expert stylists are ready to give you a personalized recommendation in person!";
  }
}

export async function getCategoryDescription(categoryName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a brief, enticing, and professional description (max 20 words) for a hair salon service category named "${categoryName}". Make it sound luxurious and high-end.`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
}

export async function getHairCareAdvice(hairstyle: string, hairType?: string, scalpSensitivity?: string): Promise<any> {
  try {
    const prompt = `You are a professional hair care expert at "The Hair Gallery". 
    A client is asking for maintenance advice for the following hairstyle: "${hairstyle}".
    ${hairType ? `Their hair type is: "${hairType}".` : ""}
    ${scalpSensitivity ? `Their scalp sensitivity is: "${scalpSensitivity}".` : ""}

    Please provide structured advice including:
    1. Maintenance tips
    2. Washing frequency
    3. Recommended products
    4. Common mistakes to avoid
    5. Estimated duration before redo

    Return the response in JSON format with the following keys:
    "maintenanceTips": string[],
    "washingFrequency": string,
    "recommendedProducts": string[],
    "commonMistakes": string[],
    "estimatedDuration": string
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            maintenanceTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            washingFrequency: { type: Type.STRING },
            recommendedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
            commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedDuration: { type: Type.STRING },
          },
          required: ["maintenanceTips", "washingFrequency", "recommendedProducts", "commonMistakes", "estimatedDuration"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
