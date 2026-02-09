import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const insets = useSafeAreaInsets();

    const features = [
        {
            id: 'words',
            title: 'Learn Words',
            description: 'Expand your vocabulary with definitions & examples',
            icon: 'book-outline', // Ionicons name
            color: AppColors.primary,
            route: '/(tabs)/words',
            badge: 'Vocabulary',
            delay: 200,
        },
        {
            id: 'quiz',
            title: 'Vocabulary Quiz',
            description: 'Test your knowledge with AI-generated questions',
            icon: 'school-outline',
            color: '#F59E0B',
            route: '/(tabs)/quiz',
            badge: 'Interactive',
            delay: 250,
        },
        {
            id: 'sentences',
            title: 'Study Sentences',
            description: 'Master grammar patterns and structures',
            icon: 'text-outline',
            color: AppColors.success,
            route: '/(tabs)/sentences',
            badge: 'Grammar',
            delay: 300,
        },
        {
            id: 'grammar',
            title: 'Grammar Corrector',
            description: 'Instant AI powered feedback for your writing',
            icon: 'sparkles-outline',
            color: '#9B59B6', // specialized color for "magic/AI"
            route: '/(tabs)/grammar',
            badge: 'AI-Powered',
            delay: 400,
        },
        {
            id: 'settings',
            title: 'Settings',
            description: 'Manage your preferences and API keys',
            icon: 'settings-outline',
            color: AppColors.textSecondary,
            route: '/(tabs)/settings',
            badge: 'System',
            delay: 450,
        },
    ];

    return (
        <ThemedView style={[styles.container, { backgroundColor: AppColors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <Animated.View
                    entering={FadeInDown.duration(800).springify()}
                    style={styles.headerSection}
                >
                    <View style={styles.topRow}>
                        <View style={styles.greetingContainer}>
                            <ThemedText style={[styles.greeting, { color: AppColors.textSecondary }]}>Welcome to</ThemedText>
                            <ThemedText type="title" style={[styles.appName, { color: AppColors.text }]}>
                                Grammar Genius
                            </ThemedText>
                        </View>
                        <TouchableOpacity style={[styles.profileButton, { borderColor: AppColors.border }]}>
                            {/* Placeholder for settings/profile if needed, or just visual balance */}
                            <Image
                                source={require('../../assets/images/splash-icon.png')}
                                style={styles.profileImage}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={[styles.heroSubtitle, { color: AppColors.textSecondary }]}>
                        Master English with AI-powered learning and real-time corrections.
                    </ThemedText>
                </Animated.View>

                {/* Features List */}
                <View style={styles.featuresContainer}>
                    <Animated.View entering={FadeInUp.delay(100).duration(600)}>
                        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: AppColors.text }]}>
                            Start Learning
                        </ThemedText>
                    </Animated.View>

                    {features.map((feature, index) => (
                        <Link key={feature.id} href={feature.route as any} asChild>
                            <TouchableOpacity activeOpacity={0.9}>
                                <Animated.View
                                    entering={FadeInDown.delay(feature.delay).duration(600).springify()}
                                    style={[styles.card, { backgroundColor: AppColors.card, shadowColor: AppColors.shadow }]}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: feature.color + '15' }]}>
                                        <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                                    </View>

                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{feature.title}</ThemedText>
                                            <View style={[styles.badge, { backgroundColor: feature.color + '20' }]}>
                                                <Text style={[styles.badgeText, { color: feature.color }]}>{feature.badge}</Text>
                                            </View>
                                        </View>
                                        <ThemedText style={[styles.cardDescription, { color: AppColors.textSecondary }]}>
                                            {feature.description}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.arrowContainer}>
                                        <Ionicons name="chevron-forward" size={20} color={AppColors.textSecondary} opacity={0.5} />
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>
                        </Link>
                    ))}
                </View>

                {/* Daily Tip or Extra Content placeholder */}
                <Animated.View
                    entering={FadeInUp.delay(600).duration(600)}
                    style={[styles.tipContainer, { backgroundColor: AppColors.primary + '10', borderColor: AppColors.primary + '20' }]}
                >
                    <Ionicons name="bulb" size={24} color={AppColors.primary} />
                    <View style={styles.tipContent}>
                        <ThemedText type="defaultSemiBold" style={{ color: AppColors.primary }}>Did you know?</ThemedText>
                        <ThemedText style={[styles.tipText, { color: AppColors.textSecondary }]}>
                            Practice creates permanent. Regular small sessions are better than one long cram session.
                        </ThemedText>
                    </View>
                </Animated.View>

                <View style={{ height: 100 }} />
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
        marginBottom: 32,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    greetingContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        marginBottom: 4,
        opacity: 0.8,
    },
    appName: {
        fontSize: 32,
        lineHeight: 38,
        letterSpacing: -1,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    profileImage: {
        width: 48,
        height: 48,
    },
    heroSubtitle: {
        fontSize: 16,
        lineHeight: 24,
        opacity: 0.8,
        maxWidth: '90%',
    },
    featuresContainer: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 20,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        marginBottom: 4, // for shadow spacing if needed
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        gap: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        fontSize: 17,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    arrowContainer: {
        marginLeft: 8,
    },
    tipContainer: {
        marginTop: 32,
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        gap: 16,
        borderWidth: 1,
    },
    tipContent: {
        flex: 1,
        gap: 4,
    },
    tipText: {
        fontSize: 13,
        lineHeight: 19,
    },
});
