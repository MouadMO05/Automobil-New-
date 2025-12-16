
import { GoogleGenAI } from "@google/genai";
import { ProductExtractionResponse } from "../types";

// Declare process to satisfy Typescript compiler without installing node types
declare const process: { env: { API_KEY: string } };

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractProductDetails = async (url: string): Promise<{ data: ProductExtractionResponse, sources: string[] }> => {
  try {
    const prompt = `
      Analyze this product URL: ${url}

      I need a JSON response with the following fields. 
      **IMPORTANT: Translate 'title' and 'description' to Arabic if they are in another language.**

      - "title": The listing title in Arabic.
      - "description": A summary of the item details (specs, condition) in Arabic.
      - "price": The price with currency (e.g., 120,000 DH).
      - "images": An array of strings. Find up to 10 valid image URLs for this product.
      - "phoneNumber": Extract any visible phone number text (e.g., "0612345678"). Return null if not found.
      - "whatsapp": Extract any explicit WhatsApp link (e.g., wa.me/..., api.whatsapp.com/...). Return null if not found.
      
      **CRITICAL IMAGE INSTRUCTIONS**:
      1. For **Avito.ma**: Look for 'avito.st' images. Try to find the gallery images.
      2. For other sites: Collect 'og:image', product gallery tags, or 'twitter:image'.
      3. **FALLBACK**: If no direct images are found in metadata, perform a Google Search for the Listing Title and return the top 3 image results.
      4. Ensure all URLs start with 'http'.

      **CONTACT INFO INSTRUCTIONS**:
      - Aggressively look for phone numbers in the Title, Description, and specific "Seller Info" sections.
      - If you see a button link that says "WhatsApp" or "Chat", extract that link into the "whatsapp" field.

      Return ONLY raw JSON. No markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "{}";
    
    // Extract sources from grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk) => chunk.web?.uri)
      .filter((uri): uri is string => !!uri);

    // Clean up potential markdown code blocks
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data: ProductExtractionResponse;
    try {
      const parsed = JSON.parse(cleanJson);
      // Ensure images is an array
      let images: string[] = [];
      if (Array.isArray(parsed.images)) {
        images = parsed.images;
      } else if (typeof parsed.imageUrl === 'string') {
        images = [parsed.imageUrl]; // Backward compatibility fallback
      }
      
      data = {
        title: parsed.title || "عنوان غير متوفر",
        description: parsed.description || "",
        price: parsed.price || "---",
        images: images.filter(url => url && url.startsWith('http')),
        phoneNumber: parsed.phoneNumber || undefined,
        whatsapp: parsed.whatsapp || undefined,
      };

    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", text);
      data = {
        title: "تفاصيل المنتج غير متاحة",
        description: "لم نتمكن من استخراج التفاصيل تلقائيًا.",
        price: "---",
        images: [],
      };
    }

    return { data, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
