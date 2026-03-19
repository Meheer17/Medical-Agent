import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
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

interface Message {
    id: string;
    from: 'ai' | 'you';
    text: string;
}

const presetSymptoms = [
    'Sharp chest pain and shortness of breath',
    'Fever for 4 days with body aches',
    'Mild cough and sore throat',
];

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'hello',
            from: 'ai',
            text: 'I am your medical coordinator. Describe symptoms to triage and I will pull doctor slots.',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const listRef = useRef<FlatList<Message>>(null);

    useEffect(() => {
        const bootstrap = async () => {
            const stored = await AsyncStorage.getItem('token');
            if (!stored) {
                router.replace('/');
                return;
            }
            setToken(stored);
        };
        bootstrap();
    }, []);

    const scrollToEnd = () => {
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    };

    const addMessage = (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || !token) return;
        const userMsg: Message = { id: `${Date.now()}-you`, from: 'you', text };
        addMessage(userMsg);
        setInput('');
        setLoading(true);
        try {
            const triage = await axios.post(
                `${API_BASE}/triage/analyze`,
                { symptoms: text },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const { urgency, rationale } = triage.data;
            addMessage({
                id: `${Date.now()}-ai-triage`,
                from: 'ai',
                text: `Urgency: ${urgency.toUpperCase()}\nReason: ${rationale}`,
            });

            const slots = await axios.get(`${API_BASE}/doctors/availability`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const first = slots.data?.[0];
            if (first) {
                addMessage({
                    id: `${Date.now()}-ai-slot`,
                    from: 'ai',
                    text: `Earliest slot: ${first.slot}\nDoctor: ${first.doctor_name} (${first.specialty}). Reply with the slot to book.`,
                });
            }
        } catch (err: any) {
            addMessage({ id: `${Date.now()}-ai-error`, from: 'ai', text: 'Could not analyze. Try again or re-login.' });
            if (err?.response?.status === 401) {
                await AsyncStorage.removeItem('token');
                router.replace('/');
            }
        } finally {
            setLoading(false);
            scrollToEnd();
        }
    };

    const handleSend = () => {
        sendMessage(input);
    };

    const renderItem = ({ item }: { item: Message }) => (
        <View style={[styles.message, item.from === 'you' ? styles.me : styles.ai]}>
            <Text style={styles.messageText}>{item.text}</Text>
        </View>
    );

    const header = useMemo(
        () => (
            <View style={styles.infoBar}>
                <Text style={styles.infoTitle}>Guided steps</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
                    <Text style={styles.infoText}>Describe symptoms</Text>
                </View>
                <View style={styles.badgeRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
                    <Text style={styles.infoText}>AI triage + urgency</Text>
                </View>
                <View style={styles.badgeRow}>
                    <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
                    <Text style={styles.infoText}>Doctor availability & booking</Text>
                </View>
                <View style={styles.pillsRow}>
                    {presetSymptoms.map((p) => (
                        <TouchableOpacity key={p} style={styles.pill} onPress={() => sendMessage(p)}>
                            <Text style={styles.pillText}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        ),
        [token],
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={header}
                />
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Describe symptoms, duration, pain level"
                        placeholderTextColor="#8ca0bf"
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity style={[styles.sendButton, loading && { opacity: 0.7 }]} disabled={loading} onPress={handleSend}>
                        {loading ? <ActivityIndicator color="#0b132b" /> : <Text style={styles.sendText}>Send</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c1527' },
    list: { padding: 16, gap: 12 },
    message: {
        padding: 12,
        borderRadius: 14,
        maxWidth: '90%',
        borderWidth: 1,
        borderColor: '#1d2a44',
    },
    me: {
        alignSelf: 'flex-end',
        backgroundColor: '#3ba9ff',
    },
    ai: {
        alignSelf: 'flex-start',
        backgroundColor: '#121d32',
    },
    messageText: { color: '#e9f2ff', fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 20 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderTopWidth: 1,
        borderTopColor: '#15223a',
        backgroundColor: '#0f1b2f',
    },
    input: {
        flex: 1,
        backgroundColor: '#121d32',
        color: '#f2f6ff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2f48',
        minHeight: 48,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    sendButton: {
        backgroundColor: '#3ba9ff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendText: { color: '#0b132b', fontFamily: 'SpaceGrotesk_600SemiBold' },
    infoBar: {
        backgroundColor: '#0f1b2f',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#1d2a44',
        gap: 8,
        marginBottom: 12,
    },
    infoTitle: { color: '#e8f1ff', fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15 },
    infoText: { color: '#b8c7de', fontFamily: 'SpaceGrotesk_400Regular' },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3ba9ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBadgeText: { color: '#0b132b', fontFamily: 'SpaceGrotesk_600SemiBold' },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    pill: {
        backgroundColor: '#182740',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#243555',
    },
    pillText: { color: '#9fb1c8', fontFamily: 'SpaceGrotesk_500Medium', fontSize: 13 },
});
