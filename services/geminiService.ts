import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Utility to convert a Blob to a Base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data:image/jpeg;base64, prefix
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to convert blob to base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const createGeminiClient = () => {
  // CRITICAL: Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key from the dialog.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeImage = async (base64Image: string): Promise<string> => {
  const ai = createGeminiClient();
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Model for image understanding
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity
              data: base64Image,
            },
          },
          { text: 'Analyze this image and describe its content in detail.' },
        ],
      },
    });
    return response.text ?? 'No detailed analysis available.';
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error(`Failed to analyze image: ${(error as Error).message || 'Unknown error'}`);
  }
};

export const generateCaptions = async (base64Image: string): Promise<string[]> => {
  const ai = createGeminiClient();
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Model for image understanding and creative caption generation
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Generate 5 very funny, short, and relevant meme captions for this image. Provide the captions as a JSON array of strings, like ["Caption 1", "Caption 2"].`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      // Sometimes the model might include markdown code block syntax. Remove it.
      const cleanedJsonStr = jsonStr.replace(/^```json\n|\n```$/g, '');
      try {
        const captions = JSON.parse(cleanedJsonStr) as string[];
        return captions.slice(0, 5); // Ensure exactly 5 captions, just in case
      } catch (parseError) {
        console.warn("Failed to parse Gemini captions as JSON, attempting fallback:", parseError);
        // Fallback: If JSON parsing fails, try to extract lines as captions
        return cleanedJsonStr.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
      }
    }
    return ['No funny captions generated this time. Try again!'];
  } catch (error) {
    console.error("Error generating captions with Gemini:", error);
    return [`Failed to generate captions: ${(error as Error).message || 'Unknown error'}`];
  }
};

export const editImage = async (base64Image: string, editPrompt: string): Promise<string | undefined> => {
  const ai = createGeminiClient();
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Model for image editing
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data; // Return base64 data of the edited image
      }
    }
    return undefined; // No image part found
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw new Error(`Failed to edit image: ${(error as Error).message || 'Unknown error'}`);
  }
};

// Helper for image loading
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Needed for canvas.toDataURL if image is from external source
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Helper to convert an HTMLImageElement to a base64 string
export const imageToBase64 = (img: HTMLImageElement, mimeType: string = 'image/jpeg', quality: number = 0.9): string => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Could not get canvas context.");
  }
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL(mimeType, quality).split(',')[1]; // Remove prefix
};

// Helper to check for API key selection for Veo/Gemini-3-pro-image-preview
export const checkAndSelectApiKey = async (): Promise<boolean> => {
  if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      alert("Please select a paid API key for advanced image generation features. You will be redirected to the API key selection.");
      await window.aistudio.openSelectKey();
      // Assume selection was successful and proceed
      return true;
    }
    return true;
  }
  console.warn("window.aistudio API not available. Cannot check/select API key for advanced features.");
  return true; // Proceed without explicit key selection if aistudio API is not available
};
