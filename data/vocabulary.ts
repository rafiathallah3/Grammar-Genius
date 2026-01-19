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

export const sampleSentences: Sentence[] = [
  {
    id: '1',
    sentence: 'I am learning English every day.',
    translation: 'Saya belajar bahasa Inggris setiap hari.',
    difficulty: 'beginner',
    category: 'Daily Activities',
    explanation: 'Simple present tense used for habitual actions.',
  },
  {
    id: '2',
    sentence: 'She has been studying for three hours.',
    translation: 'Dia telah belajar selama tiga jam.',
    difficulty: 'intermediate',
    category: 'Present Perfect Continuous',
    explanation: 'Present perfect continuous tense shows an action that started in the past and continues to the present.',
  },
  {
    id: '3',
    sentence: 'If I had known, I would have come earlier.',
    translation: 'Jika saya tahu, saya akan datang lebih awal.',
    difficulty: 'advanced',
    category: 'Conditionals',
    explanation: 'Third conditional: used to talk about hypothetical situations in the past.',
  },
  {
    id: '4',
    sentence: 'The book that I bought yesterday is very interesting.',
    translation: 'Buku yang saya beli kemarin sangat menarik.',
    difficulty: 'intermediate',
    category: 'Relative Clauses',
    explanation: 'Relative clause introduced by "that" to provide additional information about the book.',
  },
  {
    id: '5',
    sentence: 'Can you help me with this assignment?',
    translation: 'Bisakah kamu membantu saya dengan tugas ini?',
    difficulty: 'beginner',
    category: 'Questions',
    explanation: 'Polite request using "can" for asking permission or help.',
  },
  {
    id: '6',
    sentence: 'Despite the rain, we decided to go hiking.',
    translation: 'Meskipun hujan, kami memutuskan untuk pergi hiking.',
    difficulty: 'intermediate',
    category: 'Conjunctions',
    explanation: '"Despite" is used to show contrast, meaning "in spite of" or "regardless of".',
  },
  {
    id: '7',
    sentence: 'The project was completed by the team last week.',
    translation: 'Proyek diselesaikan oleh tim minggu lalu.',
    difficulty: 'intermediate',
    category: 'Passive Voice',
    explanation: 'Passive voice is used when the focus is on the action rather than who performed it.',
  },
  {
    id: '8',
    sentence: 'Not only did she finish her work, but she also helped others.',
    translation: 'Tidak hanya dia menyelesaikan pekerjaannya, tetapi dia juga membantu orang lain.',
    difficulty: 'advanced',
    category: 'Inversion',
    explanation: 'Inversion is used after "not only" for emphasis, requiring auxiliary verb before subject.',
  },
];

