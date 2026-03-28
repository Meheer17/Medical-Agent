import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
    const { user, loading, authenticating, signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (loading) {
        return (
            <SafeAreaView style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1d6d5b" />
            </SafeAreaView>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    const onSubmit = async () => {
        if (!email.trim() || !password) {
            setError('Please provide email and password.');
            return;
        }

        setError(null);
        try {
            await signIn(email, password);
            router.replace('/(tabs)');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Could not sign in. Please try again.');
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={styles.heroCard}>
                        <Text style={styles.kicker}>Navya Care Console</Text>
                        <Text style={styles.title}>Patient and Doctor Access</Text>
                        <Text style={styles.subtitle}>Sign in to chat with triage AI, book appointments, and manage care requests.</Text>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholder="name@example.com"
                            placeholderTextColor="#6f7f79"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            secureTextEntry
                            placeholder="Your password"
                            placeholderTextColor="#6f7f79"
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable onPress={onSubmit} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} disabled={authenticating}>
                            {authenticating ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
                        </Pressable>

                        <Pressable onPress={() => router.push('/signup')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                            <Text style={styles.secondaryButtonText}>Create an account</Text>
                        </Pressable>
                    </View>
                </ScrollView>
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
        backgroundColor: '#f2f7f5',
    },
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f2f7f5',
    },
    content: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
        gap: 18,
    },
    heroCard: {
        backgroundColor: '#173d36',
        borderRadius: 20,
        padding: 22,
        gap: 8,
    },
    kicker: {
        color: '#b9e6d7',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
    },
    title: {
        color: '#f7fbfa',
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '700',
    },
    subtitle: {
        color: '#d6ebe3',
        fontSize: 15,
        lineHeight: 20,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#d9ebe4',
    },
    label: {
        fontSize: 13,
        color: '#34514a',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f7fbf9',
        borderWidth: 1,
        borderColor: '#d4e6df',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#15332c',
    },
    errorText: {
        color: '#a12637',
        fontSize: 13,
        marginTop: 4,
    },
    primaryButton: {
        backgroundColor: '#1d6d5b',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 6,
        minHeight: 44,
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 15,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#c4ddd4',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#1f5145',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonPressed: {
        opacity: 0.85,
    },
});
