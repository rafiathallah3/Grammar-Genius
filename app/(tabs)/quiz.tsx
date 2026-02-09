import { AppColors } from '@/constants/theme'; // Assuming this exists based on other files
import { generateQuiz, QuizQuestion } from '@/services/gemini';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Native';
type GameState = 'setup' | 'loading' | 'quiz' | 'results';

export default function QuizScreen() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const startQuiz = async () => {
        setGameState('loading');
        try {
            const quizQuestions = await generateQuiz(questionCount, difficulty);
            setQuestions(quizQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setShowFeedback(false);
            setSelectedOption(null);
            setGameState('quiz');
        } catch (error) {
            Alert.alert('Error', 'Failed to generate quiz. Please check your internet connection and API key.');
            setGameState('setup');
        }
    };

    const handleOptionSelect = (option: string) => {
        if (showFeedback) return;
        setSelectedOption(option);
    };

    const submitAnswer = () => {
        if (!selectedOption) return;

        setShowFeedback(true);
        if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
            setScore(score + 1);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowFeedback(false);
            setSelectedOption(null);
        } else {
            setGameState('results');
        }
    };

    const resetQuiz = () => {
        setGameState('setup');
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowFeedback(false);
        setSelectedOption(null);
    };

    const renderSetup = () => (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.headerTitle}>Vocabulary Quiz</Text>
            <Text style={styles.subHeader}>Test your knowledge with AI-generated questions</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Number of Questions: {questionCount}</Text>
                <View style={styles.counterContainer}>
                    <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setQuestionCount(Math.max(3, questionCount - 1))}>
                        <MaterialIcons name="remove" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{questionCount}</Text>
                    <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setQuestionCount(Math.min(15, questionCount + 1))}>
                        <MaterialIcons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.difficultyContainer}>
                    {(['Easy', 'Medium', 'Hard', 'Expert', 'Native'] as Difficulty[]).map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.difficultyButton,
                                difficulty === level && styles.difficultyButtonActive
                            ]}
                            onPress={() => setDifficulty(level)}
                        >
                            <Text style={[
                                styles.difficultyText,
                                difficulty === level && styles.difficultyTextActive
                            ]}>{level}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
                <Text style={styles.startButtonText}>Start Quiz</Text>
                <MaterialIcons name="arrow-forward" size={24} color="#FFF" />
            </TouchableOpacity>
        </ScrollView>
    );

    const renderQuiz = () => {
        const question = questions[currentQuestionIndex];
        if (!question) return <ActivityIndicator />;

        const isCorrect = selectedOption === question.correctAnswer;

        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</Text>

                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{question.question}</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {question.options.map((option, index) => {
                        let optionStyle: ViewStyle = styles.optionButton;
                        let textStyle: TextStyle = styles.optionText;

                        if (showFeedback) {
                            if (option === question.correctAnswer) {
                                optionStyle = styles.optionCorrect;
                                textStyle = styles.optionTextLight;
                            } else if (option === selectedOption && option !== question.correctAnswer) {
                                optionStyle = styles.optionIncorrect;
                                textStyle = styles.optionTextLight;
                            }
                        } else if (selectedOption === option) {
                            optionStyle = styles.optionSelected;
                            textStyle = styles.optionTextLight;
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                style={optionStyle}
                                onPress={() => handleOptionSelect(option)}
                                disabled={showFeedback}
                            >
                                <Text style={textStyle}>{option}</Text>
                                {showFeedback && option === question.correctAnswer && (
                                    <MaterialIcons name="check-circle" size={24} color="#FFF" />
                                )}
                                {showFeedback && option === selectedOption && option !== question.correctAnswer && (
                                    <MaterialIcons name="cancel" size={24} color="#FFF" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {!showFeedback && (
                    <TouchableOpacity
                        style={[styles.actionButton, !selectedOption && styles.disabledButton]}
                        onPress={submitAnswer}
                        disabled={!selectedOption}
                    >
                        <Text style={styles.actionButtonText}>Check Answer</Text>
                    </TouchableOpacity>
                )}

                {showFeedback && (
                    <View style={styles.feedbackContainer}>
                        <View style={[styles.feedbackHeader, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
                            <MaterialIcons name={isCorrect ? "check-circle" : "error"} size={24} color="#FFF" />
                            <Text style={styles.feedbackHeaderText}>{isCorrect ? 'Correct!' : 'Incorrect'}</Text>
                        </View>

                        <View style={styles.feedbackContent}>
                            {!isCorrect && (
                                <View style={styles.feedbackSection}>
                                    <Text style={styles.feedbackLabel}>Correct Answer:</Text>
                                    <Text style={styles.feedbackValue}>{question.correctAnswer}</Text>
                                </View>
                            )}

                            <View style={styles.feedbackSection}>
                                <Text style={styles.feedbackLabel}>Definition:</Text>
                                <Text style={styles.feedbackValue}>{question.definition}</Text>
                            </View>

                            <View style={styles.feedbackSection}>
                                <Text style={styles.feedbackLabel}>Example:</Text>
                                <Text style={styles.feedbackValueItalic}>"{question.example}"</Text>
                            </View>

                            <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
                                <Text style={styles.nextButtonText}>Next Question</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderResults = () => {
        const percentage = (score / questions.length) * 100;
        let feedbackMsg = '';
        if (percentage === 100) feedbackMsg = 'Perfect! You are a master!';
        else if (percentage >= 80) feedbackMsg = 'Great job! Keep it up!';
        else if (percentage >= 60) feedbackMsg = 'Good effort! Practice makes perfect.';
        else feedbackMsg = 'Keep learning! You will get better.';

        return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                <View style={styles.resultCard}>
                    <MaterialIcons name="emoji-events" size={80} color={AppColors.primary} />
                    <Text style={styles.resultTitle}>Quiz Completed!</Text>
                    <Text style={styles.resultScore}>{score} / {questions.length}</Text>
                    <Text style={styles.resultPercentage}>{Math.round(percentage)}%</Text>
                    <Text style={styles.resultMessage}>{feedbackMsg}</Text>

                    <TouchableOpacity style={styles.restartButton} onPress={resetQuiz}>
                        <Text style={styles.restartButtonText}>Play Again</Text>
                        <MaterialIcons name="refresh" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {gameState === 'setup' && renderSetup()}
            {gameState === 'loading' && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={styles.loadingText}>Generating your quiz...</Text>
                </View>
            )}
            {gameState === 'quiz' && renderQuiz()}
            {gameState === 'results' && renderResults()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: AppColors.textSecondary,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        color: '#718096',
        marginBottom: 30,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 16,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EDF2F7',
        borderRadius: 15,
        padding: 10,
    },
    counterButton: {
        backgroundColor: AppColors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    counterValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    difficultyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    difficultyButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#EDF2F7',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    difficultyButtonActive: {
        backgroundColor: '#EBF8FF',
        borderColor: AppColors.primary,
    },
    difficultyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
    },
    difficultyTextActive: {
        color: AppColors.primary,
    },
    startButton: {
        backgroundColor: AppColors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        marginTop: 10,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    startButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    // Quiz Styles
    progressBar: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: AppColors.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 20,
        textAlign: 'right',
    },
    questionCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2D3748',
        lineHeight: 30,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    optionButton: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#EDF2F7',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionSelected: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionCorrect: {
        backgroundColor: '#48BB78',
        borderColor: '#48BB78',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionIncorrect: {
        backgroundColor: '#F56565',
        borderColor: '#F56565',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4A5568',
        flex: 1,
    },
    optionTextLight: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        flex: 1,
    },
    actionButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#CBD5E0',
        opacity: 0.7,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    feedbackContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 10,
    },
    feedbackCorrect: {
        backgroundColor: '#48BB78',
    },
    feedbackIncorrect: {
        backgroundColor: '#F56565',
    },
    feedbackHeaderText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    feedbackContent: {
        padding: 20,
    },
    feedbackSection: {
        marginBottom: 16,
    },
    feedbackLabel: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
        marginBottom: 4,
    },
    feedbackValue: {
        fontSize: 16,
        color: '#2D3748',
        lineHeight: 24,
    },
    feedbackValueItalic: {
        fontSize: 16,
        color: '#2D3748',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    nextButton: {
        backgroundColor: AppColors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 10,
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    // Result Styles
    resultContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    resultCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A202C',
        marginTop: 20,
        marginBottom: 10,
    },
    resultScore: {
        fontSize: 48,
        fontWeight: '800',
        color: AppColors.primary,
        marginBottom: 5,
    },
    resultPercentage: {
        fontSize: 18,
        color: '#718096',
        fontWeight: '600',
        marginBottom: 20,
    },
    resultMessage: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    restartButton: {
        backgroundColor: AppColors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    restartButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
});
