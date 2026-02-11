import { AppColors } from '@/constants/theme';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTROL_BAR_HEIGHT = 100;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - CONTROL_BAR_HEIGHT - 60; // Padding

interface ImageCropperProps {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
    onCrop: (uri: string) => void;
}

export default function ImageCropper({ visible, imageUri, onClose, onCrop }: ImageCropperProps) {
    const [imageSize, setImageSize] = useState<{ width: number, height: number } | null>(null);
    const [displayedImageSize, setDisplayedImageSize] = useState<{ width: number, height: number } | null>(null);
    const [loading, setLoading] = useState(false);

    const cropX = useSharedValue(0);
    const cropY = useSharedValue(0);
    const cropWidth = useSharedValue(0);
    const cropHeight = useSharedValue(0);

    const minCropSize = 50;

    useEffect(() => {
        if (visible && imageUri) {
            setLoading(false);
            ImageManipulator.manipulateAsync(imageUri, [], { format: ImageManipulator.SaveFormat.JPEG })
                .then(result => {
                    const width = result.width;
                    const height = result.height;
                    setImageSize({ width, height });

                    const scaleW = (SCREEN_WIDTH - 40) / width;
                    const scaleH = AVAILABLE_HEIGHT / height;
                    const scale = Math.min(scaleW, scaleH);

                    const displayW = width * scale;
                    const displayH = height * scale;

                    setDisplayedImageSize({ width: displayW, height: displayH });

                    const initW = displayW * 0.8;
                    const initH = displayH * 0.8;
                    cropWidth.value = initW;
                    cropHeight.value = initH;
                    cropX.value = (displayW - initW) / 2;
                    cropY.value = (displayH - initH) / 2;
                })
                .catch(error => {
                    console.error("Failed to get image size", error);
                });
        }
    }, [visible, imageUri]);

    const panGesture = Gesture.Pan()
        .onChange((e) => {
            if (!displayedImageSize) return;
            const newX = cropX.value + e.changeX;
            const newY = cropY.value + e.changeY;

            cropX.value = Math.max(0, Math.min(newX, displayedImageSize.width - cropWidth.value));
            cropY.value = Math.max(0, Math.min(newY, displayedImageSize.height - cropHeight.value));
        });

    const createResizeGesture = (corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => {
        return Gesture.Pan()
            .onChange((e) => {
                if (!displayedImageSize) return;

                const changeX = e.changeX;
                const changeY = e.changeY;

                if (corner === 'topLeft') {
                    const rightEdge = cropX.value + cropWidth.value;
                    const targetX = cropX.value + changeX;
                    const clampedX = Math.max(0, Math.min(targetX, rightEdge - minCropSize));
                    const newW = rightEdge - clampedX;

                    const bottomEdge = cropY.value + cropHeight.value;
                    const targetY = cropY.value + changeY;
                    const clampedY = Math.max(0, Math.min(targetY, bottomEdge - minCropSize));
                    const newH = bottomEdge - clampedY;

                    cropX.value = clampedX;
                    cropWidth.value = newW;
                    cropY.value = clampedY;
                    cropHeight.value = newH;

                } else if (corner === 'topRight') {
                    const bottomEdge = cropY.value + cropHeight.value;
                    const targetY = cropY.value + changeY;
                    const clampedY = Math.max(0, Math.min(targetY, bottomEdge - minCropSize));

                    const newH = bottomEdge - clampedY;
                    const targetW = cropWidth.value + changeX;
                    const maxW = displayedImageSize.width - cropX.value;
                    const clampedW = Math.max(minCropSize, Math.min(targetW, maxW));

                    cropY.value = clampedY;
                    cropHeight.value = newH;
                    cropWidth.value = clampedW;

                } else if (corner === 'bottomLeft') {
                    const rightEdge = cropX.value + cropWidth.value;
                    const targetX = cropX.value + changeX;
                    const clampedX = Math.max(0, Math.min(targetX, rightEdge - minCropSize));
                    const newW = rightEdge - clampedX;

                    const targetH = cropHeight.value + changeY;
                    const maxH = displayedImageSize.height - cropY.value;
                    const clampedH = Math.max(minCropSize, Math.min(targetH, maxH));

                    cropX.value = clampedX;
                    cropWidth.value = newW;
                    cropHeight.value = clampedH;

                } else if (corner === 'bottomRight') {
                    const targetW = cropWidth.value + changeX;
                    const maxW = displayedImageSize.width - cropX.value;
                    const clampedW = Math.max(minCropSize, Math.min(targetW, maxW));

                    const targetH = cropHeight.value + changeY;
                    const maxH = displayedImageSize.height - cropY.value;
                    const clampedH = Math.max(minCropSize, Math.min(targetH, maxH));

                    cropWidth.value = clampedW;
                    cropHeight.value = clampedH;
                }
            });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: cropX.value },
            { translateY: cropY.value }
        ],
        width: cropWidth.value,
        height: cropHeight.value,
    }));

    const handleCrop = async () => {
        if (!imageUri || !imageSize || !displayedImageSize) return;
        setLoading(true);

        try {
            const scale = imageSize.width / displayedImageSize.width;

            const originX = cropX.value * scale;
            const originY = cropY.value * scale;
            const width = cropWidth.value * scale;
            const height = cropHeight.value * scale;

            const safeOriginX = Math.max(0, originX);
            const safeOriginY = Math.max(0, originY);
            const safeWidth = Math.min(width, imageSize.width - safeOriginX);
            const safeHeight = Math.min(height, imageSize.height - safeOriginY);

            const result = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ crop: { originX: safeOriginX, originY: safeOriginY, width: safeWidth, height: safeHeight } }],
                { format: ImageManipulator.SaveFormat.JPEG }
            );

            onCrop(result.uri);
        } catch (error) {
            console.error("Crop error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    <View style={styles.contentContainer}>
                        {displayedImageSize && imageUri ? (
                            <View style={{
                                width: displayedImageSize.width,
                                height: displayedImageSize.height,
                                position: 'relative'
                            }}>
                                <Image
                                    source={{ uri: imageUri }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="stretch"
                                />

                                {/* Overlay System */}
                                <AnimatedOverlay
                                    cropX={cropX}
                                    cropY={cropY}
                                    cropWidth={cropWidth}
                                    cropHeight={cropHeight}
                                    containerWidth={displayedImageSize.width}
                                    containerHeight={displayedImageSize.height}
                                />

                                {/* Crop Box */}
                                <GestureDetector gesture={panGesture}>
                                    <Animated.View style={[styles.cropBox, animatedStyle]}>
                                        {/* Grid Lines (Optional) */}
                                        <View style={styles.gridRow} />
                                        <View style={styles.gridRow} />
                                        <View style={styles.gridCol} />
                                        <View style={styles.gridCol} />

                                        {/* Corners */}
                                        <GestureDetector gesture={createResizeGesture('topLeft')}>
                                            <View style={[styles.corner, styles.topLeft]} />
                                        </GestureDetector>
                                        <GestureDetector gesture={createResizeGesture('topRight')}>
                                            <View style={[styles.corner, styles.topRight]} />
                                        </GestureDetector>
                                        <GestureDetector gesture={createResizeGesture('bottomLeft')}>
                                            <View style={[styles.corner, styles.bottomLeft]} />
                                        </GestureDetector>
                                        <GestureDetector gesture={createResizeGesture('bottomRight')}>
                                            <View style={[styles.corner, styles.bottomRight]} />
                                        </GestureDetector>
                                    </Animated.View>
                                </GestureDetector>
                            </View>
                        ) : (
                            <ActivityIndicator size="large" color="#fff" />
                        )}
                    </View>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.button} onPress={onClose}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Adjust Crop</Text>
                        <TouchableOpacity
                            style={[styles.button, styles.doneButton]}
                            onPress={handleCrop}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.doneText}>Done</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const AnimatedOverlay = ({ cropX, cropY, cropWidth, cropHeight, containerWidth, containerHeight }: any) => {

    const topStyle = useAnimatedStyle(() => ({
        height: cropY.value,
        width: containerWidth,
        top: 0,
        left: 0,
    }));

    const bottomStyle = useAnimatedStyle(() => ({
        height: containerHeight - (cropY.value + cropHeight.value),
        width: containerWidth,
        top: cropY.value + cropHeight.value,
        left: 0,
    }));

    const leftStyle = useAnimatedStyle(() => ({
        height: cropHeight.value,
        width: cropX.value,
        top: cropY.value,
        left: 0,
    }));

    const rightStyle = useAnimatedStyle(() => ({
        height: cropHeight.value,
        width: containerWidth - (cropX.value + cropWidth.value),
        top: cropY.value,
        left: cropX.value + cropWidth.value,
    }));

    const style: ViewStyle = { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' };

    return (
        <>
            <Animated.View style={[style, topStyle]} />
            <Animated.View style={[style, bottomStyle]} />
            <Animated.View style={[style, leftStyle]} />
            <Animated.View style={[style, rightStyle]} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cropBox: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        backgroundColor: 'transparent', // Hit slop area
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Visible corner markers
    topLeft: { top: -10, left: -10, borderTopWidth: 4, borderLeftWidth: 4, borderColor: AppColors.primary, width: 20, height: 20 },
    topRight: { top: -10, right: -10, borderTopWidth: 4, borderRightWidth: 4, borderColor: AppColors.primary, width: 20, height: 20 },
    bottomLeft: { bottom: -10, left: -10, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: AppColors.primary, width: 20, height: 20 },
    bottomRight: { bottom: -10, right: -10, borderBottomWidth: 4, borderRightWidth: 4, borderColor: AppColors.primary, width: 20, height: 20 },

    gridRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        top: '33%',
    },
    gridCol: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        left: '33%',
    },
    controls: {
        height: CONTROL_BAR_HEIGHT,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#111',
    },
    button: {
        padding: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    doneButton: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    doneText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});
