export interface DictionaryWord {
  word: string;
  phonetic?: string;
  phonetics: {
    text?: string;
    audio?: string;
  }[];
  origin?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }[];
  }[];
}

export interface WordResult {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audioUrl?: string;
  origin?: string;
  synonyms?: string[];
  antonyms?: string[];
  allMeanings?: DictionaryWord['meanings'];
}

export async function searchWord(word: string): Promise<WordResult[]> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Word not found in dictionary');
      }
      throw new Error('Failed to fetch word definition');
    }

    const data: DictionaryWord[] = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No results found');
    }

    // Convert API response to our WordResult format
    const results: WordResult[] = [];
    
    data.forEach((entry) => {
      entry.meanings.forEach((meaning) => {
        meaning.definitions.forEach((def, index) => {
          // Get phonetic from entry or first phonetics entry
          const phonetic = entry.phonetic || entry.phonetics?.[0]?.text;
          // Get audio URL from phonetics
          const audioUrl = entry.phonetics?.find(p => p.audio)?.audio;
          
          // Determine difficulty based on word length and complexity
          let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
          const wordLength = entry.word.length;
          if (wordLength <= 5) {
            difficulty = 'beginner';
          } else if (wordLength > 8 || entry.meanings.length > 2) {
            difficulty = 'advanced';
          }

          results.push({
            word: entry.word,
            phonetic: phonetic,
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example || '',
            difficulty,
            audioUrl: audioUrl ? `https:${audioUrl}` : undefined,
            origin: entry.origin,
            synonyms: def.synonyms && def.synonyms.length > 0 ? def.synonyms : undefined,
            antonyms: def.antonyms && def.antonyms.length > 0 ? def.antonyms : undefined,
            allMeanings: entry.meanings,
          });
        });
      });
    });

    return results;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to search word');
  }
}

