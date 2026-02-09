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
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview', safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

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

export async function analyzeSentence(sentence: string, targetLanguage: string = 'Indonesian'): Promise<SentenceAnalysis> {
    const genAI = await getGenAI();
    if (!genAI) {
        throw new Error('Gemini API key is not configured. Please set your API key in Settings.');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `You are an English language expert. Analyze the following sentence and provide detailed information.

Sentence: "${sentence}"

Please provide a JSON response with the following structure:
{
  "meaning": "a clear and concise explanation of what the sentence means",
  "difficulty": "beginner" or "intermediate" or "advanced",
  "category": "the grammar category or topic (e.g., 'Present Tense', 'Conditionals', 'Relative Clauses', 'Questions', 'Passive Voice', etc.) [MUST BE ONE OF THE CATEGORY LISTED]",
  "explanation": "detailed explanation of the grammar structure, vocabulary, and usage",
  "translation": "translation to ${targetLanguage} if helpful, otherwise omit this field"
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


export interface WordDetails {
    word: string;
    definition: string;
    example: string;
    partOfSpeech: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export async function generateWordDetails(word: string): Promise<WordDetails[]> {
    const genAI = await getGenAI();
    if (!genAI) {
        throw new Error('Gemini API key is not configured. Please set your API key in Settings.');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `You are an English dictionary for learners. Define the following word and provide an example sentence for each of its major meanings (e.g. as a noun, verb, etc).

Word: "${word}"

Please provide a JSON response with the following structure:
{
  "definitions": [
    {
      "word": "${word}",
      "definition": "simple and understandable definition",
      "example": "a clear example sentence using the word",
      "partOfSpeech": "noun/verb/adjective/etc",
      "difficulty": "beginner" or "intermediate" or "advanced"
    }
  ]
}

Keep the definitions simple and capable of being understood by an English learner. If the word has multiple distinct meanings or parts of speech, include them as separate items in the array.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.definitions && Array.isArray(parsed.definitions)) {
                return parsed.definitions.map((item: any) => {
                    if (!['beginner', 'intermediate', 'advanced'].includes(item.difficulty)) {
                        item.difficulty = 'intermediate';
                    }
                    return item as WordDetails;
                });
            }
        }

        throw new Error('Failed to parse word details response.');
    } catch (error) {
        console.error('Error fetching word details:', error);
        throw new Error('Failed to fetch word details. Please try again.');
    }
}

export interface QuizQuestion {
    word: string;
    question: string;
    options: string[];
    correctAnswer: string;
    definition: string;
    example: string;
}

export async function generateQuiz(count: number, difficulty: string): Promise<QuizQuestion[]> {
    const genAI = await getGenAI();
    if (!genAI) {
        throw new Error('Gemini API key is not configured. Please set your API key in Settings.');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `You are an English teacher creating a vocabulary quiz. Create a multiple-choice quiz with ${count} questions for a student at the "${difficulty}" level.

For each question:
1. Select a word that is interesting and appropriate for this level.
2. Create a question (e.g., "What is the definition of X?").
3. Provide 4 distinct options. One must be the correct definition, others should be plausible distractors.
4. Indicate which option is the correct answer.
5. Provide the definition of the word.
6. Provide an example sentence using the word.

Please provide a JSON response with the following structure:
{
  "questions": [
    {
      "word": "the word being tested",
      "question": "The question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The text of the correct option",
      "definition": "The definition",
      "example": "Example sentence"
    }
  ]
}

Ensure the JSON is valid.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                return parsed.questions as QuizQuestion[];
            }
        }

        throw new Error('Failed to parse quiz response.');
    } catch (error) {
        console.error('Error generating quiz:', error);
        throw new Error('Failed to generate quiz. Please try again.');
    }
}
