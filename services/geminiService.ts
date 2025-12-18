import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage } from "../types";
import { PDF_CONTEXT } from "../constants";

let chatSession: Chat | null = null;

export const initializeChat = () => {
  // Always get key from env
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Using gemini-3-flash-preview as recommended for text tasks
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are an AI tutor for an employee training course on "Entering the Age of AI". 
      Your goal is to help the user understand the quiz questions they are solving.
      
      Context from the training presentation:
      ${PDF_CONTEXT}

      Rules:
      1. Answer strictly based on the provided context.
      2. Keep answers concise (under 3 sentences unless detailed explanation is requested).
      3. Be encouraging and helpful.
      4. If the user asks about the specific quiz question they just answered, explain *why* the correct answer is correct based on the slides.
      `,
    },
  });
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
      return "Error: AI Service not initialized.";
  }

  try {
    const response = await chatSession.sendMessage({ message: userMessage });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error connecting to the AI assistant.";
  }
};
