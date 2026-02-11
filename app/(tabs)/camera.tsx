import ImageCropper from '@/components/ImageCropper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors } from '@/constants/theme';
import { analyzeImage } from '@/services/gemini';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy for readAsStringAsync
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CameraScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<import('@/services/gemini').ImageAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cropperVisible, setCropperVisible] = useState(false);

    // Animation values
    const uploadScale = useSharedValue(1);

    useEffect(() => {
        if (params.imageUri) {
            const decodedUri = decodeURIComponent(params.imageUri as string);
            resetState();
            setImageUri(decodedUri);
            // Don't auto analyze shared images, let user crop/analyze manually
        }
    }, [params.imageUri]);

    const resetState = () => {
        setImageUri(null);
        setAnalysisResult(null);
        setError(null);
        setLoading(false);
        setCropperVisible(false);
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, // This enables the cropping UI
                quality: 1,
            });

            if (!result.canceled) {
                resetState();
                setImageUri(result.assets[0].uri);
                handleAnalyzeImage(result.assets[0].uri);
            }
        } catch (e) {
            console.error("Error picking image:", e);
            Alert.alert("Error", "Failed to pick image.");
        }
    };

    const handleManualAnalyze = () => {
        if (imageUri) {
            handleAnalyzeImage(imageUri);
        }
    };

    const handleCrop = (uri: string) => {
        setImageUri(uri);
        setCropperVisible(false);
        // Reset analysis when image changes
        setAnalysisResult(null);
        setError(null);
    };

    async function handleAnalyzeImage(contentUri: string) {
        setLoading(true);
        setAnalysisResult(null);
        setError(null);

        try {
            // 1. Create a temporary path in app's cache (if needed for reading)
            // Note: ImagePicker results are already accessible, but content:// URIs need copying
            let uriToRead = contentUri;

            if (contentUri.startsWith('content://')) {
                const tempUri = FileSystem.cacheDirectory + 'temp_share_image.jpg';
                await FileSystem.copyAsync({
                    from: contentUri,
                    to: tempUri
                });
                uriToRead = tempUri;
            }

            // 2. Read as Base64
            const base64 = await FileSystem.readAsStringAsync(uriToRead, {
                encoding: 'base64'
            });

            // 3. Send to Gemini Service
            const result = await analyzeImage(base64);
            setAnalysisResult(result);

        } catch (e) {
            console.error("Analysis Error:", e);
            const errorMessage = e instanceof Error ? e.message : "Failed to analyze image.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: AppColors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerIconContainer}>
                    <Ionicons name="scan-outline" size={24} color={AppColors.primary} />
                </View>
                <ThemedText type="title" style={styles.title}>Image Analysis</ThemedText>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Section */}
                <View style={[styles.imageCard, { backgroundColor: AppColors.card }]}>
                    {imageUri ? (
                        <Animated.View entering={FadeInDown.springify()} style={styles.imageWrapper}>
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                            {loading && (
                                <View style={styles.loadingOverlay}>
                                    <View style={[styles.loadingBox, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                                        <ActivityIndicator size="large" color={AppColors.primary} />
                                        <Text style={{ marginTop: 12, fontWeight: '600', color: AppColors.primary }}>
                                            Analyzing...
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {!loading && (
                                <>
                                    <TouchableOpacity
                                        style={styles.changeImageButton}
                                        onPress={() => setCropperVisible(true)}
                                    >
                                        <Ionicons name="crop-outline" size={20} color="#fff" />
                                        <Text style={styles.changeImageText}>Crop Image</Text>
                                    </TouchableOpacity>


                                </>
                            )}
                        </Animated.View>
                    ) : (
                        <TouchableOpacity
                            style={styles.placeholderContainer}
                            onPress={pickImage}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: AppColors.primary + '10' }]}>
                                <Ionicons name="images-outline" size={48} color={AppColors.primary} />
                            </View>
                            <ThemedText type="defaultSemiBold" style={styles.placeholderTitle}>
                                Select Image
                            </ThemedText>
                            <Text style={styles.placeholderText}>
                                Pick from Gallery or Share to App.{"\n"}
                                Supports cropping for better results.
                            </Text>

                            <View style={[styles.selectButton, { backgroundColor: AppColors.primary }]}>
                                <Text style={styles.selectButtonText}>Open Gallery</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Analyze Button */}
                {imageUri && !analysisResult && !loading && (
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: AppColors.primary, marginBottom: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                        onPress={handleManualAnalyze}
                    >
                        <Ionicons name="sparkles" size={24} color="#fff" />
                        <Text style={styles.buttonText}>Analyze Image</Text>
                    </TouchableOpacity>
                )}

                {/* Error Message */}
                {error && (
                    <Animated.View entering={FadeInUp} style={[styles.errorCard, { backgroundColor: AppColors.error + '10' }]}>
                        <Ionicons name="alert-circle" size={24} color={AppColors.error} />
                        <Text style={[styles.errorText, { color: AppColors.error }]}>{error}</Text>
                    </Animated.View>
                )}

                {/* Result Section */}
                {analysisResult && !loading && (
                    <View style={{ gap: 16, paddingBottom: 40 }}>
                        <View style={styles.resultHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="sparkles" size={20} color={AppColors.success} />
                                <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>Analysis Results</ThemedText>
                            </View>
                        </View>

                        {analysisResult.sentences.map((item, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInUp.delay(index * 200).springify()}
                                style={[styles.resultCard, { backgroundColor: AppColors.card, marginBottom: 0 }]}
                            >
                                <View style={styles.sentenceHeader}>
                                    <View style={styles.numberBadge}>
                                        <Text style={styles.numberText}>{index + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.originalSentence, { color: AppColors.text }]}>
                                            {item.original}
                                        </Text>
                                        <Text style={[styles.translation, { color: AppColors.textSecondary }]}>
                                            {item.translation}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <Text style={[styles.explanationText, { color: AppColors.text }]}>
                                    {item.explanation}
                                </Text>
                            </Animated.View>
                        ))}

                        <TouchableOpacity
                            style={[styles.secondaryButton, { borderColor: AppColors.primary }]}
                            onPress={pickImage}
                        >
                            <Text style={[styles.secondaryButtonText, { color: AppColors.primary }]}>Pick Another Image</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <ImageCropper
                visible={cropperVisible}
                imageUri={imageUri}
                onClose={() => setCropperVisible(false)}
                onCrop={handleCrop}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: AppColors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
    },
    imageCard: {
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    imageWrapper: {
        width: '100%',
        height: 400,
        position: 'relative',
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingBox: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    changeImageButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    changeImageText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    placeholderContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    placeholderTitle: {
        fontSize: 20,
        marginBottom: 12,
        textAlign: 'center',
    },
    placeholderText: {
        fontSize: 15,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    selectButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    selectButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    resultCard: {
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 24,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    copyButton: {
        padding: 8,
        backgroundColor: AppColors.background,
        borderRadius: 12,
    },
    divider: {
        height: 1,
        backgroundColor: AppColors.border,
        marginBottom: 16,
    },
    resultText: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    iconButton: {
        padding: 8,
        borderRadius: 12,
    },
    primaryButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
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
    sentenceHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    numberBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    originalSentence: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    translation: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    explanationText: {
        fontSize: 15,
        lineHeight: 22,
    },
    secondaryButton: {
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginTop: 20,
    },
    secondaryButtonText: {
        fontWeight: '600',
        fontSize: 16,
    },
});