import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { sampleWords, Word } from '@/data/vocabulary';
import { searchWord, WordResult } from '@/services/dictionary';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function WordsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [apiResults, setApiResults] = useState<Word[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearched, setLastSearched] = useState<string>('');

  // Animation values
  const searchFocused = useSharedValue(0);

  // Convert WordResult to Word format
  const convertToWord = (result: WordResult, index: number): Word => ({
    id: `api_${result.word}_${index}`,
    word: result.word,
    phonetic: result.phonetic,
    partOfSpeech: result.partOfSpeech,
    definition: result.definition,
    example: result.example,
    difficulty: result.difficulty,
  });

  // Search API when user types and stops (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() && searchQuery.trim() !== lastSearched) {
        handleApiSearch(searchQuery.trim());
      } else if (!searchQuery.trim()) {
        setApiResults([]);
        setSearchError(null);
        setLastSearched('');
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleApiSearch = async (query: string) => {
    const inSampleWords = sampleWords.some(
      (w) => w.word.toLowerCase() === query.toLowerCase()
    );
    if (inSampleWords) {
      setApiResults([]);
      setSearchError(null);
      return;
    }

    setSearching(true);
    setSearchError(null);
    setLastSearched(query);

    try {
      const results = await searchWord(query);
      const convertedWords = results.map((result, index) => convertToWord(result, index));
      setApiResults(convertedWords);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search word';
      setSearchError(errorMessage);
      setApiResults([]);
    } finally {
      setSearching(false);
    }
  };

  const allWords = [...sampleWords, ...apiResults];

  const filteredWords = allWords.filter((word) => {
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || word.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return AppColors.success;
      case 'intermediate': return '#FFA726';
      case 'advanced': return AppColors.error;
      default: return AppColors.textSecondary;
    }
  };

  const isApiWord = (wordId: string) => wordId.startsWith('api_');

  const searchContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(searchFocused.value ? 1.02 : 1) }],
      shadowOpacity: withTiming(searchFocused.value ? 0.15 : 0.05),
    };
  });

  const renderWordItem = ({ item, index }: { item: Word; index: number }) => {
    const isSelected = selectedWord?.id === item.id;
    const difficultyColor = getDifficultyColor(item.difficulty);
    const fromApi = isApiWord(item.id);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
        style={styles.wordCardWrapper}
      >
        <TouchableOpacity
          style={[
            styles.wordCard,
            {
              backgroundColor: AppColors.card,
              borderColor: isSelected ? AppColors.primary : 'transparent',
              borderWidth: isSelected ? 2 : 0,
            },
          ]}
          onPress={() => setSelectedWord(isSelected ? null : item)}
          activeOpacity={0.9}
        >
          <View style={styles.cardMain}>
            <View style={styles.wordHeader}>
              <View style={styles.wordTitleRow}>
                <ThemedText type="defaultSemiBold" style={[styles.wordText, { color: AppColors.text }]}>
                  {item.word}
                </ThemedText>
                {fromApi && <Ionicons name="cloud-download-outline" size={16} color={AppColors.primary} />}
              </View>
              {item.phonetic && (
                <Text style={[styles.phonetic, { color: AppColors.textSecondary }]}>
                  {item.phonetic}
                </Text>
              )}
            </View>

            <View style={styles.wordRight}>
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
              <Text style={[styles.partOfSpeech, { color: AppColors.textSecondary }]}>
                {item.partOfSpeech}
              </Text>
            </View>
          </View>

          {isSelected && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.wordDetails}
            >
              <View style={styles.divider} />
              <ThemedText style={[styles.definition, { color: AppColors.text }]}>
                {item.definition}
              </ThemedText>
              {item.example && (
                <View style={[styles.exampleContainer, { backgroundColor: AppColors.background }]}>
                  <ThemedText type="defaultSemiBold" style={[styles.exampleLabel, { color: AppColors.textSecondary }]}>
                    Example
                  </ThemedText>
                  <ThemedText style={[styles.example, { color: AppColors.text }]}>
                    "{item.example}"
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
      <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: AppColors.card }]}>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.pageTitle}>Vocabulary</ThemedText>
          <ThemedText style={styles.pageSubtitle}>Expand your word power</ThemedText>
        </View>

        <Animated.View style={[styles.searchContainer, searchContainerStyle]}>
          <Ionicons name="search" size={20} color={AppColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: AppColors.text }]}
            placeholder="Search words..."
            placeholderTextColor={AppColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => (searchFocused.value = 1)}
            onBlur={() => (searchFocused.value = 0)}
          />
          {searching && <ActivityIndicator size="small" color={AppColors.primary} />}
        </Animated.View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((difficulty) => {
              const isActive = difficultyFilter === difficulty;
              const difficultyColor = difficulty === 'all' ? AppColors.primary : getDifficultyColor(difficulty);
              return (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterChip,
                    isActive
                      ? { backgroundColor: difficultyColor, borderColor: difficultyColor }
                      : { backgroundColor: 'transparent', borderColor: AppColors.border },
                  ]}
                  onPress={() => setDifficultyFilter(difficulty)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? '#FFF' : AppColors.textSecondary, fontWeight: isActive ? '700' : '500' },
                    ]}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredWords}
        renderItem={renderWordItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !searching ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color={AppColors.textSecondary} style={{ opacity: 0.3 }} />
              <ThemedText style={{ color: AppColors.textSecondary, marginTop: 16 }}>
                {searchQuery ? 'No definitions found.' : 'No words to show.'}
              </ThemedText>
            </View>
          ) : null
        }
        ListHeaderComponent={
          searchError ? (
            <View style={[styles.errorCard, { backgroundColor: AppColors.error + '10' }]}>
              <Text style={{ color: AppColors.error }}>{searchError}</Text>
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
  headerContainer: {
    paddingBottom: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  headerContent: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  pageSubtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  searchContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  filterContainer: {
    marginTop: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
  },
  listContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  wordCardWrapper: {
    marginBottom: 12,
  },
  wordCard: {
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordHeader: {
    gap: 4,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordText: {
    fontSize: 18,
    letterSpacing: -0.5,
  },
  phonetic: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  wordRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  partOfSpeech: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  wordDetails: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  definition: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  exampleContainer: {
    padding: 12,
    borderRadius: 12,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    opacity: 0.5,
  },
  example: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
});
