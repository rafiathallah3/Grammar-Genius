export interface Word {
    id: string;
    word: string;
    phonetic?: string;
    partOfSpeech: string;
    definition: string;
    example: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Sentence {
    id: string;
    sentence: string;
    translation?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    explanation?: string;
}

export const sampleWords: Word[] = [
    {
        id: '1',
        word: 'beautiful',
        phonetic: '/ˈbjuːtɪfəl/',
        partOfSpeech: 'adjective',
        definition: 'pleasing to the senses or mind aesthetically',
        example: 'She has a beautiful smile.',
        difficulty: 'beginner',
    },
    {
        id: '2',
        word: 'accomplish',
        phonetic: '/əˈkʌmplɪʃ/',
        partOfSpeech: 'verb',
        definition: 'to achieve or complete successfully',
        example: 'We need to accomplish our goals by the end of the month.',
        difficulty: 'intermediate',
    },
    {
        id: '3',
        word: 'serendipity',
        phonetic: '/ˌserənˈdɪpɪti/',
        partOfSpeech: 'noun',
        definition: 'the occurrence and development of events by chance in a happy or beneficial way',
        example: 'Finding that book was pure serendipity.',
        difficulty: 'advanced',
    },
    {
        id: '4',
        word: 'diligent',
        phonetic: '/ˈdɪlɪdʒənt/',
        partOfSpeech: 'adjective',
        definition: 'having or showing care and conscientiousness in one\'s work or duties',
        example: 'She is a diligent student who always completes her homework.',
        difficulty: 'intermediate',
    },
    {
        id: '5',
        word: 'ubiquitous',
        phonetic: '/juːˈbɪkwɪtəs/',
        partOfSpeech: 'adjective',
        definition: 'present, appearing, or found everywhere',
        example: 'Smartphones have become ubiquitous in modern society.',
        difficulty: 'advanced',
    },
    {
        id: '6',
        word: 'grateful',
        phonetic: '/ˈɡreɪtfəl/',
        partOfSpeech: 'adjective',
        definition: 'feeling or showing an appreciation for something done or received',
        example: 'I am grateful for your help.',
        difficulty: 'beginner',
    },
    {
        id: '7',
        word: 'perseverance',
        phonetic: '/ˌpɜːsɪˈvɪərəns/',
        partOfSpeech: 'noun',
        definition: 'persistence in doing something despite difficulty or delay in achieving success',
        example: 'His perseverance paid off when he finally passed the exam.',
        difficulty: 'intermediate',
    },
    {
        id: '8',
        word: 'eloquent',
        phonetic: '/ˈeləkwənt/',
        partOfSpeech: 'adjective',
        definition: 'fluent or persuasive in speaking or writing',
        example: 'She gave an eloquent speech at the conference.',
        difficulty: 'advanced',
    },
];

export const sampleSentences: Sentence[] = [];

