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
import type { SignUpPayload } from '@/lib/types';

type RegisterRole = 'patient' | 'doctor';

export default function SignupScreen() {
    const { user, loading, authenticating, signUp } = useAuth();

    const [role, setRole] = useState<RegisterRole>('patient');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [location, setLocation] = useState('');
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
        if (!fullName.trim() || !email.trim() || !password) {
            setError('Name, email, and password are required.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (role === 'doctor' && !specialty.trim()) {
            setError('Specialty is required for doctor accounts.');
            return;
        }

        const payload: SignUpPayload = {
            full_name: fullName.trim(),
            email: email.trim(),
            password,
            role,
            specialty: role === 'doctor' ? specialty.trim() : undefined,
            location: role === 'doctor' ? location.trim() || undefined : undefined,
        };

        setError(null);
        try {
            await signUp(payload);
            router.replace('/(tabs)');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Could not create account. Please try again.');
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={styles.heroCard}>
                        <Text style={styles.kicker}>Create account</Text>
                        <Text style={styles.title}>Start using Navya mobile</Text>
                        <Text style={styles.subtitle}>Patients can triage and book instantly. Doctors can track every request and appointment.</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.roleRow}>
                            <Pressable
                                style={({ pressed }) => [styles.roleButton, role === 'patient' && styles.roleButtonActive, pressed && styles.buttonPressed]}
                                onPress={() => setRole('patient')}>
                                <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>Patient</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.roleButton, role === 'doctor' && styles.roleButtonActive, pressed && styles.buttonPressed]}
                                onPress={() => setRole('doctor')}>
                                <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextActive]}>Doctor</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.label}>Full name</Text>
                        <TextInput
                            placeholder="Your full name"
                            placeholderTextColor="#6f7f79"
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                        />

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
                            placeholder="Minimum 8 characters"
                            placeholderTextColor="#6f7f79"
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                        />

                        {role === 'doctor' ? (
                            <>
                                <Text style={styles.label}>Specialty</Text>
                                <TextInput
                                    placeholder="Cardiology, Dermatology, etc."
                                    placeholderTextColor="#6f7f79"
                                    style={styles.input}
                                    value={specialty}
                                    onChangeText={setSpecialty}
                                />

                                <Text style={styles.label}>Location (optional)</Text>
                                <TextInput
                                    placeholder="Clinic or city"
                                    placeholderTextColor="#6f7f79"
                                    style={styles.input}
                                    value={location}
                                    onChangeText={setLocation}
                                />
                            </>
                        ) : null}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable onPress={onSubmit} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} disabled={authenticating}>
                            {authenticating ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
                        </Pressable>

                        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                            <Text style={styles.secondaryButtonText}>Back to sign in</Text>
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
        gap: 18,
    },
    heroCard: {
        backgroundColor: '#0f4a56',
        borderRadius: 20,
        padding: 22,
        gap: 8,
    },
    kicker: {
        color: '#b9e8f2',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
    },
    title: {
        color: '#f4fcff',
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '700',
    },
    subtitle: {
        color: '#cde6eb',
        fontSize: 15,
        lineHeight: 20,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#d7e7e9',
    },
    roleRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    roleButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#c7d9dc',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#f6fafb',
    },
    roleButtonActive: {
        borderColor: '#0f6f86',
        backgroundColor: '#0f6f86',
    },
    roleButtonText: {
        color: '#365960',
        fontWeight: '600',
        fontSize: 14,
    },
    roleButtonTextActive: {
        color: '#ffffff',
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
        backgroundColor: '#0f6f86',
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
        color: '#285f68',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonPressed: {
        opacity: 0.85,
    },
});
