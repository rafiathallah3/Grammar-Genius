import { loadApiKey } from '@/utils/storage';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Function to get API key from storage or environment
async function getApiKey(): Promise<string | null> {
  try {
    // First try to get from storage
    const storedKey = await loadApiKey();
    if (storedKey) {
      return storedKey;
    }
    // Fallback to environment variable
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
  } catch (error) {
    console.error('Error loading API key:', error);
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
  }
}

// Function to get initialized Gemini AI instance
async function getGenAI() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export interface GrammarCorrection {
  correctedSentence: string;
  corrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
}

export interface SentenceAnalysis {
  meaning: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  explanation: string;
  translation?: string;
}

export async function correctGrammar(sentence: string): Promise<GrammarCorrection> {
  const genAI = await getGenAI();
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please set your API key in Settings.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]});

    const prompt = `You are an English grammar expert. Analyze the following sentence and provide corrections.

Sentence: "${sentence}"

Please provide a JSON response with the following structure:
{
  "correctedSentence": "the fully corrected sentence",
  "corrections": [
    {
      "original": "incorrect part",
      "corrected": "corrected part",
      "explanation": "brief explanation of the error"
    }
  ]
}

If the sentence is already correct, return the same sentence with an empty corrections array.
If the sentence has asterisk (*) in the beginning and end, keep it as it is.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as GrammarCorrection;
    }

    return {
      correctedSentence: sentence,
      corrections: [],
    };
  } catch (error) {
    console.error('Error correcting grammar:', error);
    throw new Error(`Failed to correct grammar. Please check your API key and try again. Full error: ${error}`);
  }
}

export async function analyzeSentence(sentence: string): Promise<SentenceAnalysis> {
  const genAI = await getGenAI();
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please set your API key in Settings.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an English language expert. Analyze the following sentence and provide detailed information.

Sentence: "${sentence}"

Please provide a JSON response with the following structure:
{
  "meaning": "a clear and concise explanation of what the sentence means",
  "difficulty": "beginner" or "intermediate" or "advanced",
  "category": "the grammar category or topic (e.g., 'Present Tense', 'Conditionals', 'Relative Clauses', 'Questions', 'Passive Voice', etc.)",
  "explanation": "detailed explanation of the grammar structure, vocabulary, and usage",
  "translation": "translation to Indonesian (Bahasa Indonesia) if helpful, otherwise omit this field"
}

Determine the difficulty based on:
- beginner: simple sentences with basic vocabulary and grammar
- intermediate: sentences with more complex structures, idioms, or moderate vocabulary
- advanced: sentences with sophisticated grammar, advanced vocabulary, or complex constructions

Choose an appropriate category that best describes the grammar pattern or topic.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate difficulty
      if (!['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty)) {
        parsed.difficulty = 'intermediate';
      }
      return parsed as SentenceAnalysis;
    }

    // Fallback if JSON parsing fails
    throw new Error('Failed to parse analysis response. Please try again.');
  } catch (error) {
    console.error('Error analyzing sentence:', error);
    if (error instanceof Error && error.message.includes('parse')) {
      throw error;
    }
    throw new Error('Failed to analyze sentence. Please check your API key and try again.');
  }
}

