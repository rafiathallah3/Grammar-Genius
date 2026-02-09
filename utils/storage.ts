import { Sentence } from '@/data/vocabulary';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SENTENCES_STORAGE_KEY = '@grammar_genius:sentences';
const API_KEY_STORAGE_KEY = '@grammar_genius:api_key';

export async function saveSentence(sentence: Sentence): Promise<void> {
    try {
        const existingSentences = await loadSentences();
        const updatedSentences = [...existingSentences, sentence];
        await AsyncStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(updatedSentences));
    } catch (error) {
        console.error('Error saving sentence:', error);
        throw new Error('Failed to save sentence');
    }
}

export async function loadSentences(): Promise<Sentence[]> {
    try {
        const data = await AsyncStorage.getItem(SENTENCES_STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading sentences:', error);
        return [];
    }
}

export async function deleteSentence(id: string): Promise<void> {
    try {
        const existingSentences = await loadSentences();
        const updatedSentences = existingSentences.filter((s) => s.id !== id);
        await AsyncStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(updatedSentences));
    } catch (error) {
        console.error('Error deleting sentence:', error);
        throw new Error('Failed to delete sentence');
    }
}

export async function saveApiKey(apiKey: string): Promise<void> {
    try {
        await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } catch (error) {
        console.error('Error saving API key:', error);
        throw new Error('Failed to save API key');
    }
}

export async function loadApiKey(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error('Error loading API key:', error);
        return null;
    }
}

export async function deleteApiKey(): Promise<void> {
    try {
        await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error('Error deleting API key:', error);
        throw new Error('Failed to delete API key');
    }
}

const TRANSLATION_LANGUAGE_KEY = '@grammar_genius:translation_language';

export async function saveTranslationLanguage(language: string): Promise<void> {
    try {
        await AsyncStorage.setItem(TRANSLATION_LANGUAGE_KEY, language);
    } catch (error) {
        console.error('Error saving translation language:', error);
        throw new Error('Failed to save translation language');
    }
}

export async function loadTranslationLanguage(): Promise<string> {
    try {
        const language = await AsyncStorage.getItem(TRANSLATION_LANGUAGE_KEY);
        return language || 'English'; // Default to English
    } catch (error) {
        console.error('Error loading translation language:', error);
        return 'English';
    }
}
