# Grammar Genius 📚✨

A React Native mobile application for learning and studying English words and sentences, featuring AI-powered grammar correction using Google Gemini.

## Features

- 📖 **Vocabulary Learning**: Explore a comprehensive database of English words with definitions, phonetic pronunciations, parts of speech, and example sentences
- 📝 **Sentence Learning**: Study English sentences with translations, explanations, and grammar pattern breakdowns
- ✨ **AI Grammar Corrector**: Get real-time grammar corrections powered by Google Gemini AI
- 🎯 **Difficulty Levels**: Learn at your own pace with Beginner, Intermediate, and Advanced levels
- 🔍 **Search & Filter**: Easily find words and sentences by searching or filtering by difficulty and category
- 🌙 **Dark Mode Support**: Beautiful UI that adapts to your device's theme

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Google Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your Google Gemini API key:

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Running the App

Start the Expo development server:

```bash
npm start
# or
npx expo start
```

Then choose one of the following options:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan the QR code with Expo Go app on your physical device
- Press `w` to open in web browser

## Project Structure

```
Grammar-Genius/
├── app/
│   └── (tabs)/
│       ├── index.tsx      # Home dashboard
│       ├── words.tsx      # Vocabulary learning screen
│       ├── sentences.tsx  # Sentence learning screen
│       └── grammar.tsx    # Grammar correction screen
├── components/            # Reusable UI components
├── constants/            # App constants and theme
├── data/
│   └── vocabulary.ts     # Sample words and sentences data
├── services/
│   └── gemini.ts         # Gemini AI integration service
└── hooks/                # Custom React hooks
```

## Usage

### Learning Words

1. Navigate to the **Words** tab
2. Browse through the vocabulary list
3. Use the search bar to find specific words
4. Filter by difficulty level (Beginner, Intermediate, Advanced)
5. Tap on any word card to see detailed information including:
   - Phonetic pronunciation
   - Part of speech
   - Definition
   - Example sentence

### Learning Sentences

1. Navigate to the **Sentences** tab
2. Browse through sentence examples
3. Search for specific sentences or translations
4. Filter by difficulty level and category
5. Tap on any sentence card to see:
   - Translation (if available)
   - Grammar explanation
   - Sentence structure breakdown

### Grammar Correction

1. Navigate to the **Grammar** tab
2. Type or paste an English sentence in the text box
3. Tap "Correct Grammar" to get AI-powered corrections
4. Review the corrected sentence and detailed feedback
5. Learn from the explanations provided for each correction

## API Configuration

The app uses Google Gemini AI for grammar correction. Make sure you have:

1. A valid Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. The API key set in your `.env` file as `EXPO_PUBLIC_GEMINI_API_KEY`

**Note**: The grammar correction feature will not work without a valid API key. The app will display an error message if the API key is missing or invalid.

## Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tooling
- **TypeScript**: Type-safe JavaScript
- **Google Gemini AI**: AI-powered grammar correction
- **Expo Router**: File-based routing
- **React Navigation**: Navigation library

## Contributing

Contributions are welcome! Feel free to:

- Add more words and sentences to the vocabulary database
- Improve the UI/UX
- Add new features
- Fix bugs
- Improve documentation

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions:

1. Check that your Gemini API key is correctly set in the `.env` file
2. Ensure all dependencies are installed (`npm install`)
3. Check the Expo documentation for troubleshooting
4. Open an issue on GitHub

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Google Gemini AI](https://ai.google.dev/)

---

Made with ❤️ for English learners worldwide
