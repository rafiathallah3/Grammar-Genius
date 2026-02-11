# Grammar Genius

A React Native mobile application for learning English words and sentences, featuring AI-powered grammar correction using Google Gemini.

## Features

- Vocabulary Learning: Comprehensive database of English words with definitions, phonetic pronunciations, and examples
- Sentence Learning: Study English sentences with translations and grammar breakdowns
- AI Grammar Corrector: Real-time grammar corrections enabled by Google Gemini AI
- Difficulty Levels: Beginner, Intermediate, and Advanced options
- Search & Filter: Find content by difficulty and category
- Dark Mode Support: Adapts to device theme

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI
- Google Gemini API key from Google AI Studio

## Installation

1. Clone and install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

## Running the App

Start the development server:

```bash
npx expo run:android
```