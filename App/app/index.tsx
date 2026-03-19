import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:8000';

export default function LoginScreen() {
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const bootstrap = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                router.replace('/chat');
            }
        };
        bootstrap();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Enter email and password');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const body = new URLSearchParams();
            body.append('username', email);
            body.append('password', password);
            const res = await axios.post(`${API_BASE}/auth/login`, body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            await AsyncStorage.setItem('token', res.data.access_token);
            router.replace('/chat');
        } catch (err: any) {
            setError('Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0b132b', '#1c2541', '#3a506b']} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Autonomous Triage</Text>
                        </View>
                        <Text style={styles.title}>Sign in to continue</Text>
                        <Text style={styles.subtitle}>
                            Securely chat with the medical assistant, get triaged, verify coverage, and book.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            placeholder="you@example.com"
                            placeholderTextColor="#7f8c9f"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                        />
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            placeholder="••••••••"
                            placeholderTextColor="#7f8c9f"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                        />
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} disabled={loading} onPress={handleLogin}>
                            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                        </TouchableOpacity>

                        <View style={styles.pillsRow}>
                            <TouchableOpacity onPress={() => setEmail('demo@example.com')} style={styles.pill}>
                                <Text style={styles.pillText}>Use demo email</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setPassword('password123')} style={styles.pill}>
                                <Text style={styles.pillText}>Fill password</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.steps}>
                        <Text style={styles.stepTitle}>How it flows</Text>
                        <View style={styles.stepRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.stepText}>Chat your symptoms to get an urgency score.</Text>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.stepText}>Match with doctors and verify insurance automatically.</Text>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.stepText}>Confirm an appointment slot without leaving chat.</Text>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 20 },
    header: { marginTop: 24, gap: 10 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#23334d' },
    badgeText: { color: '#9cd2ff', fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 0.5 },
    title: { color: '#e8f1ff', fontSize: 30, fontFamily: 'SpaceGrotesk_600SemiBold' },
    subtitle: { color: '#9fb1c8', fontSize: 16, lineHeight: 22, fontFamily: 'SpaceGrotesk_400Regular' },
    formCard: {
        marginTop: 24,
        backgroundColor: 'rgba(17, 27, 46, 0.9)',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#23334d',
        gap: 8,
    },
    label: { color: '#8ea2c3', fontFamily: 'SpaceGrotesk_500Medium', marginTop: 6 },
    input: {
        backgroundColor: '#0f1a2c',
        color: '#f2f6ff',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2f48',
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    error: { color: '#ff9f9f', fontFamily: 'SpaceGrotesk_500Medium', marginTop: 4 },
    button: {
        marginTop: 10,
        backgroundColor: '#3ba9ff',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#3ba9ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
    },
    buttonText: { color: '#0b132b', fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 16 },
    pillsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#162541' },
    pillText: { color: '#9fb1c8', fontFamily: 'SpaceGrotesk_500Medium', fontSize: 13 },
    steps: { marginTop: 22, gap: 10 },
    stepTitle: { color: '#e8f1ff', fontSize: 17, fontFamily: 'SpaceGrotesk_600SemiBold' },
    stepRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3ba9ff' },
    stepText: { color: '#b8c7de', fontSize: 15, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 20 },
});
