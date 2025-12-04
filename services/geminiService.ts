import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SelectionResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the Pro model for better linguistic capabilities regarding Arabic grammar and Tashkeel
const modelName = "gemini-2.5-flash"; 

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    originalText: {
      type: Type.STRING,
      description: "The raw Arabic text extracted from the image.",
    },
    vocalizedText: {
      type: Type.STRING,
      description: "The Arabic text fully vocalized with correct Tashkeel/Diacritics.",
    },
    translatedText: {
      type: Type.STRING,
      description: "A fluent, high-quality French translation of the context.",
    },
    words: {
      type: Type.ARRAY,
      description: "A word-by-word breakdown of the text.",
      items: {
        type: Type.OBJECT,
        properties: {
          arabic: { type: Type.STRING, description: "The single Arabic word (vocalized)." },
          french: { type: Type.STRING, description: "The French meaning of this specific word in context." },
        },
        required: ["arabic", "french"]
      }
    }
  },
  required: ["originalText", "vocalizedText", "translatedText", "words"],
};

/**
 * Performs OCR, Vocalization, and Deep Translation on a base64 image string.
 */
export const analyzeSelection = async (base64Image: string): Promise<SelectionResult> => {
  try {
    // Remove header if present (data:image/png;base64,...)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `
      You are an expert Arabic Linguist and Translator.
      
      1. **OCR**: Analyze the provided image and extract the Arabic text. Fix any OCR imperfections based on context.
      2. **Vocalization**: Add full Tashkeel (diacritics) to the Arabic text to make it grammatically correct and readable.
      3. **Global Translation**: Translate the full sentence/phrase into natural, fluent French.
      4. **Word-by-Word**: Break down the sentence into individual words/terms and provide the specific French meaning for each word within this context.

      Return the result strictly in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3, // Slightly higher for better linguistic formulation
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text);
    return {
      originalText: result.originalText,
      vocalizedText: result.vocalizedText || result.originalText,
      translatedText: result.translatedText,
      words: result.words || []
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
