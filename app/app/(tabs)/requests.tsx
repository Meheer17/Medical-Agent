import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
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
import { fetchAppointments, fetchPatientById } from '@/lib/api';
import type { Appointment, PatientProfile } from '@/lib/types';

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString();
}

export default function RequestsScreen() {
    const { token, user } = useAuth();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patientMap, setPatientMap] = useState<Record<number, PatientProfile>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const pendingRequests = useMemo(
        () => appointments.filter((item) => item.status === 'pending'),
        [appointments],
    );

    const loadRequests = useCallback(async () => {
        if (!token || user?.role !== 'doctor') {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const schedule = await fetchAppointments(token);
            setAppointments(schedule);

            const uniquePatientIds = [...new Set(schedule.map((item) => item.patient_id))];
            const patientPairs = await Promise.all(
                uniquePatientIds.map(async (patientId) => {
                    const patient = await fetchPatientById(token, patientId);
                    return [patientId, patient] as const;
                }),
            );
            const nextMap: Record<number, PatientProfile> = {};
            patientPairs.forEach(([id, patient]) => {
                nextMap[id] = patient;
            });
            setPatientMap(nextMap);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load doctor requests.');
        } finally {
            setLoading(false);
        }
    }, [token, user?.role]);

    useFocusEffect(
        useCallback(() => {
            void loadRequests();
        }, [loadRequests]),
    );

    if (user?.role !== 'doctor') {
        return (
            <SafeAreaView style={styles.centeredWrap}>
                <Text style={styles.emptyTitle}>Doctor access only</Text>
                <Text style={styles.emptyBody}>This tab is reserved for doctor accounts to review requests and appointments.</Text>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#735116" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <Pressable style={styles.refreshButton} onPress={loadRequests}>
                    <Text style={styles.refreshText}>Refresh requests</Text>
                </Pressable>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Incoming request queue</Text>
                    <Text style={styles.helperText}>These are pending appointments waiting for confirmation or handling.</Text>
                    {pendingRequests.map((item) => (
                        <View key={item.id} style={[styles.requestCard, styles.pendingCard]}>
                            <Text style={styles.requestHeading}>Request #{item.id}</Text>
                            <Text style={styles.requestText}>Patient: {patientMap[item.patient_id]?.full_name || `Patient #${item.patient_id}`}</Text>
                            <Text style={styles.requestText}>Time: {formatDate(item.scheduled_at)}</Text>
                            {item.notes ? <Text style={styles.requestText}>Notes: {item.notes}</Text> : null}
                        </View>
                    ))}
                    {!pendingRequests.length ? <Text style={styles.helperText}>No pending requests right now.</Text> : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>All assigned appointments</Text>
                    {appointments.map((item) => (
                        <View key={item.id} style={styles.requestCard}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.requestHeading}>Appointment #{item.id}</Text>
                                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.requestText}>Patient: {patientMap[item.patient_id]?.full_name || `Patient #${item.patient_id}`}</Text>
                            <Text style={styles.requestText}>When: {formatDate(item.scheduled_at)}</Text>
                            {item.notes ? <Text style={styles.requestText}>Notes: {item.notes}</Text> : null}
                        </View>
                    ))}
                    {!appointments.length ? <Text style={styles.helperText}>No appointments assigned yet.</Text> : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f7f2e8',
    },
    content: {
        padding: 14,
        gap: 12,
    },
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f2e8',
    },
    centeredWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 8,
        backgroundColor: '#f7f2e8',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4d3d1f',
    },
    emptyBody: {
        textAlign: 'center',
        color: '#6e5e3f',
        lineHeight: 20,
    },
    refreshButton: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#d2c7ad',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fffdf9',
    },
    refreshText: {
        color: '#5c4a25',
        fontWeight: '600',
        fontSize: 13,
    },
    errorText: {
        color: '#a12637',
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e0d7c2',
        backgroundColor: '#fffdf9',
        padding: 12,
        gap: 10,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#473718',
    },
    helperText: {
        fontSize: 13,
        color: '#6b5d40',
        lineHeight: 18,
    },
    requestCard: {
        borderWidth: 1,
        borderColor: '#e2d9c5',
        borderRadius: 10,
        padding: 10,
        gap: 4,
        backgroundColor: '#fffefb',
    },
    pendingCard: {
        borderColor: '#c29039',
        backgroundColor: '#fff7ea',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    requestHeading: {
        color: '#48381a',
        fontWeight: '700',
        fontSize: 14,
    },
    statusText: {
        color: '#6f5e39',
        fontSize: 11,
        fontWeight: '700',
    },
    requestText: {
        color: '#5d4e30',
        fontSize: 13,
        lineHeight: 18,
    },
});
