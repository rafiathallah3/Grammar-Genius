import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { deleteApiKey, loadApiKey, loadTranslationLanguage, saveApiKey, saveTranslationLanguage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMasked, setIsMasked] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('Indonesian');

  // Animation shared values
  const inputFocused = useSharedValue(0);

  useEffect(() => {
    loadStoredApiKey();
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const lang = await loadTranslationLanguage();
    setTargetLanguage(lang);
  };

  const handleLanguageChange = async (lang: string) => {
    setTargetLanguage(lang);
    await saveTranslationLanguage(lang);
  };

  const loadStoredApiKey = async () => {
    try {
      setLoading(true);
      const storedKey = await loadApiKey();
      if (storedKey) {
        setApiKey(storedKey);
      } else {
        const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (envKey) {
          setApiKey(envKey);
        }
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key.');
      return;
    }

    try {
      setSaving(true);
      await saveApiKey(apiKey.trim());
      Alert.alert('Success', 'API key saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete API Key',
      'Are you sure you want to delete the stored API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApiKey();
              setApiKey('');
              Alert.alert('Success', 'API key deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete API key. Please try again.');
            }
          },
        },
      ]
    );
  };

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return key;
    const start = key.substring(0, 4);
    const end = key.substring(key.length - 4);
    const masked = '•'.repeat(Math.min(key.length - 8, 24)); // Use dots and limit length
    return `${start} ${masked} ${end}`;
  };

  const inputStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(inputFocused.value ? AppColors.primary : AppColors.border),
      borderWidth: 2,
      shadowOpacity: withTiming(inputFocused.value ? 0.08 : 0),
      backgroundColor: withTiming(inputFocused.value ? '#fff' : AppColors.background),
    };
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: AppColors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={32} color={AppColors.text} />
          </View>
          <View>
            <ThemedText type="title" style={styles.pageTitle}>Settings</ThemedText>
            <ThemedText style={{ opacity: 0.6 }}>Manage your preferences</ThemedText>
          </View>
        </Animated.View>

        {/* API Key Section */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600).springify()}
          style={[styles.card, { backgroundColor: AppColors.card }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: AppColors.primary + '15' }]}>
              <Ionicons name="key" size={20} color={AppColors.primary} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Gemini API Key</ThemedText>
          </View>

          <ThemedText style={[styles.description, { color: AppColors.textSecondary }]}>
            Required for AI features. Stored securely on your device.
          </ThemedText>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={AppColors.primary} />
            </View>
          ) : (
            <>
              <Animated.View style={[styles.inputContainer, inputStyle]}>
                <TextInput
                  style={[styles.input, { color: AppColors.text }]}
                  placeholder="Enter API Key..."
                  placeholderTextColor={AppColors.textSecondary}
                  value={isMasked && apiKey ? maskApiKey(apiKey) : apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => (inputFocused.value = 1)}
                  onBlur={() => (inputFocused.value = 0)}
                />
                <TouchableOpacity
                  onPress={() => setIsMasked(!isMasked)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={isMasked ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={AppColors.textSecondary}
                  />
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.actions}>
                {apiKey ? (
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: AppColors.error + '10' }]}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={20} color={AppColors.error} />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: AppColors.primary, opacity: saving ? 0.7 : 1 }
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Save Key</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={[styles.helpBox, { backgroundColor: AppColors.background }]}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Ionicons name="information-circle-outline" size={20} color={AppColors.primary} />
              <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>Need a key?</ThemedText>
            </View>
            <Text style={[styles.helpText, { color: AppColors.textSecondary }]}>
              Get your free API key from Google AI Studio.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://makersuite.google.com/app/apikey')}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: AppColors.primary, fontWeight: '600' }}>Get API Key →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Translation Language Section */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(600).springify()}
          style={[styles.card, { backgroundColor: AppColors.card }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: AppColors.textSecondary + '15' }]}>
              <Ionicons name="language" size={20} color={AppColors.textSecondary} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Translation Language</ThemedText>
          </View>

          <ThemedText style={[styles.description, { color: AppColors.textSecondary }]}>
            Choose the target language for sentence analysis and translations.
          </ThemedText>

          <View style={styles.languageContainer}>
            {['Indonesian', 'English', 'Japanese', 'Korean', 'Mandarin', 'Burmese', 'Tetum'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageChip,
                  {
                    backgroundColor: targetLanguage === lang ? AppColors.primary : 'transparent',
                    borderColor: targetLanguage === lang ? AppColors.primary : AppColors.border,
                  }
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={[
                  styles.languageText,
                  { color: targetLanguage === lang ? '#fff' : AppColors.textSecondary, fontWeight: targetLanguage === lang ? '600' : '400' }
                ]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* About Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600).springify()}
          style={[styles.card, { backgroundColor: AppColors.card }]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: AppColors.textSecondary + '15' }]}>
              <Ionicons name="information" size={20} color={AppColors.text} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>About</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: AppColors.textSecondary }]}>Version</Text>
            <Text style={[styles.infoValue, { color: AppColors.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, { color: AppColors.textSecondary }]}>Build</Text>
            <Text style={[styles.infoValue, { color: AppColors.text }]}>Production</Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={{ color: AppColors.textSecondary, textAlign: 'center', fontSize: 12 }}>
            Made with ❤️ by Rafi
          </Text>
        </View>

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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  loader: {
    padding: 20,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpBox: {
    padding: 16,
    borderRadius: 16,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    opacity: 0.5,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  languageText: {
    fontSize: 14,
  },
});
