import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { correctGrammar, GrammarCorrection } from '@/services/gemini';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
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

export default function GrammarScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [correction, setCorrection] = useState<GrammarCorrection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Shared values for animations
  const inputFocused = useSharedValue(0);

  const handleCorrect = async () => {
    if (!sentence.trim()) {
      Alert.alert('Error', 'Please enter a sentence to correct.');
      return;
    }

    setLoading(true);
    setError(null);
    setCorrection(null);
    Keyboard.dismiss();

    try {
      const result = await correctGrammar(sentence);
      setCorrection(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to correct grammar';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setSentence('');
    setCorrection(null);
    setError(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
    } catch {
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  useEffect(() => {
    if (params.text) {
      setSentence(params.text as string);
    }
  }, [params.text]);

  const inputStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(inputFocused.value ? '#9B59B6' : AppColors.border),
      borderWidth: 2,
      shadowOpacity: withTiming(inputFocused.value ? 0.1 : 0),
      backgroundColor: withTiming(inputFocused.value ? '#fff' : AppColors.card),
    };
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: AppColors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.headerSection}>
          <View style={[styles.headerIconContainer, { backgroundColor: '#9B59B6' + '15' }]}>
            <Ionicons name="sparkles" size={32} color="#9B59B6" />
          </View>
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Grammar Corrector
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              AI-powered magic for your writing
            </ThemedText>
          </View>
        </Animated.View>

        {/* Input Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.inputContainer}>
          <Animated.View style={[styles.inputWrapper, inputStyle]}>
            <TextInput
              style={[styles.textInput, { color: AppColors.text }]}
              placeholder="Type or paste your sentence here..."
              placeholderTextColor={AppColors.textSecondary}
              value={sentence}
              onChangeText={setSentence}
              multiline
              textAlignVertical="top"
              onFocus={() => (inputFocused.value = 1)}
              onBlur={() => (inputFocused.value = 0)}
              editable={!loading}
            />
          </Animated.View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.smallButton, { borderColor: AppColors.border, backgroundColor: AppColors.card }]}
              onPress={clearAll}
              disabled={loading || !sentence}
            >
              <Ionicons name="trash-outline" size={20} color={AppColors.textSecondary} />
              <Text style={[styles.smallButtonText, { color: AppColors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: !sentence.trim() ? '#b6b6b6ff' : '#9B59B6', // Magic Purple
                  opacity: loading ? 0.8 : 1,
                  flex: 1, // Take remaining space
                  zIndex: 999
                },
              ]}
              onPress={handleCorrect}
              disabled={loading || !sentence.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="color-wand" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Fix Grammar</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Error Message */}
        {error && (
          <Animated.View entering={FadeInUp} style={[styles.errorCard, { backgroundColor: AppColors.error + '10' }]}>
            <Ionicons name="alert-circle" size={24} color={AppColors.error} />
            <Text style={[styles.errorText, { color: AppColors.error }]}>{error}</Text>
          </Animated.View>
        )}

        {/* Results Section */}
        {correction && (
          <Animated.View entering={FadeInUp.springify()} layout={Layout.springify()}>
            <View style={styles.resultHeader}>
              <ThemedText type="subtitle">Result</ThemedText>
              {correction.corrections.length === 0 && (
                <View style={[styles.perfectBadge, { backgroundColor: AppColors.success + '15' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                  <Text style={[styles.perfectText, { color: AppColors.success }]}>Perfect!</Text>
                </View>
              )}
            </View>

            <View style={[styles.resultCard, { backgroundColor: AppColors.card, shadowColor: '#9B59B6' }]}>
              <Text style={[styles.correctedText, { color: AppColors.text }]}>
                {correction.correctedSentence}
              </Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={[styles.copyBtn, { borderColor: AppColors.border }]}
                  onPress={() => copyToClipboard(correction.correctedSentence)}
                >
                  <Ionicons name="copy-outline" size={18} color={AppColors.textSecondary} />
                  <Text style={[styles.copyText, { color: AppColors.textSecondary }]}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {correction.corrections.length > 0 && (
              <View style={styles.breakdownContainer}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 12, opacity: 0.7 }}>Changes Made ({correction.corrections.length})</ThemedText>
                {correction.corrections.map((item, index) => (
                  <Animated.View
                    entering={FadeInDown.delay(index * 100)}
                    key={index}
                    style={[styles.changeCard, { backgroundColor: AppColors.card }]}
                  >
                    <View style={styles.diffRow}>
                      <View style={[styles.diffItem, { backgroundColor: AppColors.error + '10' }]}>
                        <Text style={[styles.diffLabel, { color: AppColors.error }]}>Original</Text>
                        <Text style={[styles.diffContent, { textDecorationLine: 'line-through', opacity: 0.7 }]}>{item.original}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={AppColors.textSecondary} style={{ alignSelf: 'center' }} />
                      <View style={[styles.diffItem, { backgroundColor: AppColors.success + '10' }]}>
                        <Text style={[styles.diffLabel, { color: AppColors.success }]}>Fixed</Text>
                        <Text style={styles.diffContent}>{item.corrected}</Text>
                      </View>
                    </View>
                    <View style={[styles.explanationBox, { backgroundColor: AppColors.background }]}>
                      <Ionicons name="information-circle-outline" size={16} color={AppColors.textSecondary} style={{ marginTop: 2 }} />
                      <Text style={[styles.explanationText, { color: AppColors.textSecondary }]}>{item.explanation}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {!correction && !error && (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.tipsContainer}>
            <View style={[styles.tipCard, { backgroundColor: AppColors.primary + '10' }]}>
              <View style={[styles.tipIcon, { backgroundColor: '#fff' }]}>
                <Ionicons name="bulb-outline" size={24} color={AppColors.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: AppColors.primary }]}>Pro Tip</Text>
                <Text style={[styles.tipBody, { color: AppColors.textSecondary }]}>
                  You can paste entire paragraphs. We'll analyze them sentence by sentence!
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
  inputContainer: {
    marginBottom: 32,
    gap: 16,
  },
  inputWrapper: {
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
  },
  textInput: {
    flex: 1,
    minHeight: 120,
    padding: 16,
    fontSize: 17,
    lineHeight: 24,
  },
  clearIcon: {
    padding: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallButton: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  smallButtonText: {
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: 'transparent',
  },
  errorCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  perfectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  perfectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultCard: {
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  correctedText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownContainer: {
    gap: 12,
  },
  changeCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  diffRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  diffItem: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  diffLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  diffContent: {
    fontSize: 14,
    fontWeight: '500',
  },
  explanationBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  tipsContainer: {
    marginTop: 20,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    alignItems: 'center',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tipBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});