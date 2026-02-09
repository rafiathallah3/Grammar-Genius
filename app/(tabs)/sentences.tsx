import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { sampleSentences, Sentence } from '@/data/vocabulary';
import { analyzeSentence, SentenceAnalysis } from '@/services/gemini';
import { loadSentences, loadTranslationLanguage, saveSentence } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SentencesScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [allSentences, setAllSentences] = useState<Sentence[]>(sampleSentences);
    const [newSentenceInput, setNewSentenceInput] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        sentence: string;
        analysis: SentenceAnalysis;
    } | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Animation shared values
    const inputFocused = useSharedValue(0);

    // Load saved sentences on mount
    useEffect(() => {
        loadUserSentences();
    }, []);

    const loadUserSentences = async () => {
        try {
            const savedSentences = await loadSentences();
            setAllSentences([...sampleSentences, ...savedSentences]);
        } catch (err) {
            console.error('Error loading sentences:', err);
        }
    };

    const categories = Array.from(new Set(allSentences.map((s) => s.category)));

    const filteredSentences = allSentences.filter((sentence) => {
        const matchesSearch =
            sentence.sentence.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sentence.translation &&
                sentence.translation.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDifficulty =
            difficultyFilter === 'all' || sentence.difficulty === difficultyFilter;
        const matchesCategory = categoryFilter === 'all' || sentence.category === categoryFilter;
        return matchesSearch && matchesDifficulty && matchesCategory;
    });

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return AppColors.success;
            case 'intermediate': return '#FFA726';
            case 'advanced': return AppColors.error;
            default: return AppColors.textSecondary;
        }
    };

    const handleAnalyze = async () => {
        if (!newSentenceInput.trim()) {
            Alert.alert('Error', 'Please enter a sentence to analyze.');
            return;
        }

        setAnalyzing(true);
        setAnalysisResult(null);
        setShowAnalysis(true);
        Keyboard.dismiss();

        try {
            const targetLanguage = await loadTranslationLanguage();
            const analysis = await analyzeSentence(newSentenceInput.trim(), targetLanguage);
            setAnalysisResult({
                sentence: newSentenceInput.trim(),
                analysis,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to analyze sentence';
            Alert.alert('Error', errorMessage);
            setShowAnalysis(false);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!analysisResult) return;

        try {
            const newSentence: Sentence = {
                id: `user_${Date.now()}`,
                sentence: analysisResult.sentence,
                translation: analysisResult.analysis.translation,
                difficulty: analysisResult.analysis.difficulty,
                category: analysisResult.analysis.category,
                explanation: analysisResult.analysis.explanation,
            };

            await saveSentence(newSentence);
            await loadUserSentences();

            Alert.alert('Success', 'Sentence saved successfully!');
            setNewSentenceInput('');
            setAnalysisResult(null);
            setShowAnalysis(false);
        } catch {
            Alert.alert('Error', 'Failed to save sentence. Please try again.');
        }
    };

    const handleCancelAnalysis = () => {
        setShowAnalysis(false);
        setAnalysisResult(null);
        setNewSentenceInput('');
    };

    useEffect(() => {
        if (params.text) {
            setNewSentenceInput(params.text as string);
        }
    }, [params.text]);

    const inputStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(inputFocused.value ? AppColors.primary : AppColors.border),
            borderWidth: withTiming(inputFocused.value ? 2 : 1),
            shadowOpacity: withTiming(inputFocused.value ? 0.1 : 0),
        };
    });

    const renderSentenceItem = ({ item, index }: { item: Sentence; index: number }) => {
        const isSelected = selectedSentence?.id === item.id;
        const difficultyColor = getDifficultyColor(item.difficulty);
        const isUserSentence = item.id.startsWith('user_');

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                layout={Layout.springify()}
                style={styles.cardWrapper}
            >
                <TouchableOpacity
                    style={[
                        styles.sentenceCard,
                        {
                            backgroundColor: AppColors.card,
                            borderColor: isSelected ? AppColors.primary : 'transparent',
                            borderWidth: isSelected ? 2 : 0,
                        },
                    ]}
                    onPress={() => setSelectedSentence(isSelected ? null : item)}
                    activeOpacity={0.9}
                >
                    {isUserSentence && (
                        <View style={[styles.userBadge, { backgroundColor: AppColors.success + '15' }]}>
                            <Ionicons name="person" size={10} color={AppColors.success} style={{ marginRight: 4 }} />
                            <Text style={[styles.userBadgeText, { color: AppColors.success }]}>My Sentence</Text>
                        </View>
                    )}

                    <View style={styles.cardMain}>
                        <View style={styles.sentenceContent}>
                            <ThemedText type="defaultSemiBold" style={[styles.sentenceText, { color: AppColors.text }]}>
                                {item.sentence}
                            </ThemedText>
                        </View>

                        <View style={styles.metaColumn}>
                            <View
                                style={[
                                    styles.difficultyBadge,
                                    { backgroundColor: difficultyColor + '15' },
                                ]}
                            >
                                <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                                    {item.difficulty}
                                </Text>
                            </View>
                            <Text style={[styles.categoryText, { color: AppColors.textSecondary }]}>
                                {item.category}
                            </Text>
                        </View>
                    </View>

                    {isSelected && (
                        <Animated.View entering={FadeInUp.duration(300)} style={styles.sentenceDetails}>
                            <View style={styles.divider} />

                            {item.translation && (
                                <View style={[styles.detailBlock, { backgroundColor: AppColors.primary + '08' }]}>
                                    <ThemedText type="defaultSemiBold" style={[styles.detailLabel, { color: AppColors.textSecondary }]}>
                                        Translation
                                    </ThemedText>
                                    <ThemedText style={[styles.detailText, { color: AppColors.text }]}>
                                        {item.translation}
                                    </ThemedText>
                                </View>
                            )}

                            {item.explanation && (
                                <View style={[styles.detailBlock, { backgroundColor: AppColors.background }]}>
                                    <ThemedText type="defaultSemiBold" style={[styles.detailLabel, { color: AppColors.textSecondary }]}>
                                        Explanation
                                    </ThemedText>
                                    <ThemedText style={[styles.detailText, { color: AppColors.text }]}>
                                        {item.explanation}
                                    </ThemedText>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: AppColors.background }]}>
            <FlatList
                data={filteredSentences}
                renderItem={renderSentenceItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingTop: insets.top + 20 }
                ]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Header Section */}
                        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.headerSection}>
                            <View style={[styles.headerIconContainer, { backgroundColor: AppColors.primary + '15' }]}>
                                <Ionicons name="language" size={32} color={AppColors.primary} />
                            </View>
                            <View style={styles.headerText}>
                                <ThemedText type="title" style={styles.title}>
                                    Sentences
                                </ThemedText>
                                <ThemedText style={styles.subtitle}>
                                    Analyze and master structure
                                </ThemedText>
                            </View>
                        </Animated.View>

                        {/* Analyze Input Section */}
                        <View style={styles.analyzeSection}>
                            <Animated.View style={[styles.inputWrapper, { backgroundColor: AppColors.card }, inputStyle]}>
                                <TextInput
                                    style={[styles.input, { color: AppColors.text }]}
                                    placeholder="Type a sentence to analyze..."
                                    placeholderTextColor={AppColors.textSecondary}
                                    value={newSentenceInput}
                                    onChangeText={setNewSentenceInput}
                                    onFocus={() => (inputFocused.value = 1)}
                                    onBlur={() => (inputFocused.value = 0)}
                                    multiline
                                    textAlignVertical="top"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.analyzeButton,
                                        { backgroundColor: newSentenceInput.trim() ? AppColors.primary : AppColors.textSecondary + '40' }
                                    ]}
                                    onPress={handleAnalyze}
                                    disabled={!newSentenceInput.trim() || analyzing}
                                >
                                    {analyzing ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="sparkles" size={20} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        {/* Analysis Result Modal-like View */}
                        {showAnalysis && analysisResult && (
                            <Animated.View entering={FadeInDown.springify()} style={[styles.analysisResultCard, { backgroundColor: AppColors.card }]}>
                                <View style={styles.analysisHeader}>
                                    <ThemedText type="title" style={{ fontSize: 20 }}>Analysis</ThemedText>
                                    <TouchableOpacity onPress={handleCancelAnalysis}>
                                        <Ionicons name="close-circle" size={24} color={AppColors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.analyzedSentenceBox, { backgroundColor: AppColors.background }]}>
                                    <Text style={[styles.analyzedSentenceText, { color: AppColors.text }]}>
                                        {analysisResult.sentence}
                                    </Text>
                                </View>

                                <View style={styles.analysisTags}>
                                    <View style={[styles.tag, { backgroundColor: getDifficultyColor(analysisResult.analysis.difficulty) + '20' }]}>
                                        <Text style={[styles.tagText, { color: getDifficultyColor(analysisResult.analysis.difficulty) }]}>
                                            {analysisResult.analysis.difficulty}
                                        </Text>
                                    </View>
                                    <View style={[styles.tag, { backgroundColor: AppColors.textSecondary + '20' }]}>
                                        <Text style={[styles.tagText, { color: AppColors.text }]}>
                                            {analysisResult.analysis.category}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.analysisDetailsList}>
                                    <Text style={{ color: AppColors.textSecondary, marginBottom: 4, fontWeight: '600' }}>Meaning</Text>
                                    <Text style={{ color: AppColors.text, marginBottom: 16 }}>{analysisResult.analysis.meaning}</Text>

                                    {analysisResult.analysis.translation && (
                                        <>
                                            <Text style={{ color: AppColors.textSecondary, marginBottom: 4, fontWeight: '600' }}>Translation</Text>
                                            <Text style={{ color: AppColors.text, marginBottom: 16 }}>{analysisResult.analysis.translation}</Text>
                                        </>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: AppColors.success }]}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.saveButtonText}>Save to Collection</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Filters */}
                        <View style={styles.filtersWrapper}>
                            <FlatList
                                horizontal
                                data={['all', 'beginner', 'intermediate', 'advanced'] as const}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.filterList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.filterChip,
                                            difficultyFilter === item
                                                ? { backgroundColor: item === 'all' ? AppColors.primary : getDifficultyColor(item), borderColor: 'transparent' }
                                                : { backgroundColor: 'transparent', borderColor: AppColors.border }
                                        ]}
                                        onPress={() => setDifficultyFilter(item)}
                                    >
                                        <Text style={[
                                            styles.filterText,
                                            { color: difficultyFilter === item ? '#fff' : AppColors.textSecondary, fontWeight: difficultyFilter === item ? '600' : '500' }
                                        ]}>
                                            {item.charAt(0).toUpperCase() + item.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />

                            <FlatList
                                horizontal
                                data={['all', ...categories]}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={[styles.filterList, { marginTop: 8 }]}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.filterChip,
                                            categoryFilter === item
                                                ? { backgroundColor: AppColors.primary + '20', borderColor: AppColors.primary }
                                                : { backgroundColor: 'transparent', borderColor: AppColors.border }
                                        ]}
                                        onPress={() => setCategoryFilter(item)}
                                    >
                                        <Text style={[
                                            styles.filterText,
                                            { color: categoryFilter === item ? AppColors.primary : AppColors.textSecondary, fontWeight: categoryFilter === item ? '600' : '500' }
                                        ]}>
                                            {item.charAt(0).toUpperCase() + item.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </>
                }
                ListEmptyComponent={
                    !showAnalysis ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={64} color={AppColors.textSecondary} style={{ opacity: 0.3 }} />
                            <ThemedText style={{ color: AppColors.textSecondary, marginTop: 16 }}>
                                No sentences found.
                            </ThemedText>
                        </View>
                    ) : null
                }
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    headerIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 15,
        opacity: 0.6,
    },
    analyzeSection: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 16,
        paddingRight: 6,
        minHeight: 56,
        maxHeight: 150,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 16,
    },
    analyzeButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40,
    },
    filtersWrapper: {
        marginVertical: 20,
        gap: 0,
    },
    filterList: {
        gap: 8,
        paddingRight: 20, // To avoid clipping last item shadow if any, though here used for spacing
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 13,
    },
    cardWrapper: {
        marginBottom: 12,
    },
    sentenceCard: {
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    sentenceContent: {
        flex: 1,
    },
    sentenceText: {
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.2,
    },
    metaColumn: {
        alignItems: 'flex-end',
        gap: 6,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    categoryText: {
        fontSize: 11,
        opacity: 0.7,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 10,
    },
    userBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 12,
    },
    sentenceDetails: {
        marginTop: 0,
    },
    detailBlock: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
        opacity: 0.5,
    },
    detailText: {
        fontSize: 14,
        lineHeight: 20,
    },
    analysisResultCard: {
        marginTop: 20,
        padding: 24, // More padding for important modal feel
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    analyzedSentenceBox: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    analyzedSentenceText: {
        fontSize: 18,
        fontStyle: 'italic',
        lineHeight: 26,
    },
    analysisTags: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    analysisDetailsList: {
        marginBottom: 24,
    },
    saveButton: {
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: AppColors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
});