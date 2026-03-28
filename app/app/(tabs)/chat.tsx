import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { sendChatMessage } from '@/lib/api';

interface LocalMessage {
    id: string;
    role: 'user' | 'assistant';
    body: string;
}

function buildChatSummary(reply: string, appointmentId?: number | null): string {
    if (!appointmentId) {
        return reply;
    }
    return `${reply}\n\nAppointment ID: ${appointmentId}`;
}

export default function ChatScreen() {
    const { token, user } = useAuth();
    const [sessionId, setSessionId] = useState<string | undefined>();
    const [messages, setMessages] = useState<LocalMessage[]>([
        {
            id: 'intro',
            role: 'assistant',
            body: 'Tell me your symptoms, and I will triage urgency and suggest a slot. Reply book this slot to confirm a suggested booking.',
        },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQuickReplies, setShowQuickReplies] = useState(false);

    const canSend = useMemo(() => !!input.trim() && !sending, [input, sending]);

    const submitMessage = async (forcedMessage?: string) => {
        const message = (forcedMessage ?? input).trim();
        if (!message || !token) {
            return;
        }

        setError(null);
        setSending(true);
        setShowQuickReplies(false);

        const userMessage: LocalMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            body: message,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        try {
            const response = await sendChatMessage(token, message, sessionId);
            setSessionId(response.session_id);
            setShowQuickReplies(Boolean(response.offered_slot));

            const assistantMessage: LocalMessage = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                body: buildChatSummary(response.reply, response.appointment?.id ?? null),
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send message.');
        } finally {
            setSending(false);
        }
    };

    if (user?.role !== 'patient') {
        return (
            <SafeAreaView style={styles.centeredWrap}>
                <Text style={styles.emptyTitle}>Chat is patient-only</Text>
                <Text style={styles.emptyBody}>Doctor accounts can review requests and schedules from the Requests and Appointments tabs.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                            <Text style={[styles.bubbleText, item.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText]}>{item.body}</Text>
                        </View>
                    )}
                    ListFooterComponent={
                        sending ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator size="small" color="#1d6d5b" />
                                <Text style={styles.loadingText}>Assistant is preparing a response...</Text>
                            </View>
                        ) : null
                    }
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {showQuickReplies ? (
                    <View style={styles.quickReplyRow}>
                        <Pressable style={styles.quickReplyButton} onPress={() => submitMessage('book this slot')}>
                            <Text style={styles.quickReplyText}>Book this slot</Text>
                        </Pressable>
                        <Pressable style={styles.quickReplyButton} onPress={() => submitMessage('different slot')}>
                            <Text style={styles.quickReplyText}>Different slot</Text>
                        </Pressable>
                    </View>
                ) : null}

                <View style={styles.composerRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Describe your symptoms"
                        placeholderTextColor="#6f7f79"
                        multiline
                        value={input}
                        onChangeText={setInput}
                    />
                    <Pressable style={[styles.sendButton, !canSend && styles.sendButtonDisabled]} onPress={() => submitMessage()} disabled={!canSend}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#eef6f3',
    },
    centeredWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef6f3',
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1d4238',
    },
    emptyBody: {
        textAlign: 'center',
        color: '#3d6259',
        lineHeight: 20,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 8,
    },
    bubble: {
        maxWidth: '88%',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#1d6d5b',
        borderColor: '#1d6d5b',
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff',
        borderColor: '#d4e3de',
    },
    bubbleText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userBubbleText: {
        color: '#ffffff',
    },
    assistantBubbleText: {
        color: '#24463d',
    },
    loadingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    loadingText: {
        color: '#4e6a62',
        fontSize: 13,
    },
    errorText: {
        color: '#a12637',
        fontSize: 13,
        paddingHorizontal: 12,
        marginBottom: 6,
    },
    quickReplyRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    quickReplyButton: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#b8d4ca',
        backgroundColor: '#f6fbf9',
        paddingVertical: 10,
        alignItems: 'center',
    },
    quickReplyText: {
        color: '#255347',
        fontWeight: '600',
        fontSize: 13,
    },
    composerRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#d8e7e2',
        backgroundColor: '#f8fcfb',
    },
    input: {
        flex: 1,
        maxHeight: 90,
        borderWidth: 1,
        borderColor: '#cddfd9',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        color: '#1f3f36',
    },
    sendButton: {
        alignSelf: 'flex-end',
        backgroundColor: '#1d6d5b',
        borderRadius: 10,
        minWidth: 64,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    sendButtonDisabled: {
        backgroundColor: '#95b8ae',
    },
    sendButtonText: {
        color: '#ffffff',
        fontWeight: '700',
    },
});
