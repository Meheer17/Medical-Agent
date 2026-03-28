import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { API_BASE_URL, fetchDoctorMe, fetchPatientMe } from '@/lib/api';
import type { DoctorProfile, PatientProfile } from '@/lib/types';

export default function AccountScreen() {
    const { token, user, refreshUser, signOut } = useAuth();

    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        if (!token || !user) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (user.role === 'patient') {
                const patient = await fetchPatientMe(token);
                setPatientProfile(patient);
                setDoctorProfile(null);
            } else if (user.role === 'doctor') {
                const doctor = await fetchDoctorMe(token);
                setDoctorProfile(doctor);
                setPatientProfile(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load profile details.');
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    useFocusEffect(
        useCallback(() => {
            void loadProfile();
        }, [loadProfile]),
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <Text style={styles.heroTitle}>{user?.full_name || 'User account'}</Text>
                    <Text style={styles.heroSubtitle}>{user?.email}</Text>
                    <Text style={styles.heroRole}>Role: {user?.role?.toUpperCase()}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Profile details</Text>
                    {loading ? <ActivityIndicator size="small" color="#1d6d5b" /> : null}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {patientProfile ? (
                        <>
                            <Text style={styles.detailText}>Patient ID: {patientProfile.id}</Text>
                            <Text style={styles.detailText}>Phone: {patientProfile.phone || 'Not provided'}</Text>
                            <Text style={styles.detailText}>Date of birth: {patientProfile.date_of_birth || 'Not provided'}</Text>
                        </>
                    ) : null}

                    {doctorProfile ? (
                        <>
                            <Text style={styles.detailText}>Doctor ID: {doctorProfile.id}</Text>
                            <Text style={styles.detailText}>Specialty: {doctorProfile.specialty}</Text>
                            <Text style={styles.detailText}>Location: {doctorProfile.location || 'Not provided'}</Text>
                        </>
                    ) : null}

                    {!patientProfile && !doctorProfile && !loading && !error ? (
                        <Text style={styles.detailText}>No role-specific profile details available.</Text>
                    ) : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Connection settings</Text>
                    <Text style={styles.detailText}>Backend URL: {API_BASE_URL}</Text>
                    <Text style={styles.detailHint}>Set EXPO_PUBLIC_API_BASE_URL to point to your server when testing on a physical device.</Text>
                </View>

                <Pressable style={styles.secondaryButton} onPress={() => refreshUser()}>
                    <Text style={styles.secondaryButtonText}>Re-verify account</Text>
                </Pressable>

                <Pressable style={styles.primaryButton} onPress={() => signOut()}>
                    <Text style={styles.primaryButtonText}>Sign out</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#eef6f3',
    },
    content: {
        padding: 14,
        gap: 12,
    },
    heroCard: {
        borderRadius: 16,
        backgroundColor: '#18483e',
        padding: 14,
        gap: 4,
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
    },
    heroSubtitle: {
        color: '#d0e8df',
        fontSize: 14,
    },
    heroRole: {
        color: '#b4decf',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d4e5de',
        backgroundColor: '#ffffff',
        padding: 12,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e4339',
    },
    detailText: {
        color: '#395f55',
        fontSize: 13,
        lineHeight: 18,
    },
    detailHint: {
        color: '#5c7e75',
        fontSize: 12,
        lineHeight: 17,
    },
    errorText: {
        color: '#a12637',
        fontSize: 13,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#b7d2c9',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#f5fbf8',
    },
    secondaryButtonText: {
        color: '#285a4d',
        fontWeight: '600',
    },
    primaryButton: {
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#84263c',
        marginBottom: 14,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '700',
    },
});
