import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import {
    bookAppointment,
    fetchAppointments,
    fetchDoctorAvailability,
    fetchDoctors,
    fetchPatientMe,
} from '@/lib/api';
import type { Appointment, DoctorAvailability, DoctorProfile, PatientProfile } from '@/lib/types';

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString();
}

function statusColor(status: Appointment['status']): string {
    if (status === 'confirmed') {
        return '#1f7a49';
    }
    if (status === 'completed') {
        return '#2e5f98';
    }
    if (status === 'cancelled') {
        return '#8a2335';
    }
    return '#976014';
}

export default function AppointmentsScreen() {
    const { token, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);

    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
    const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const [manualNotes, setManualNotes] = useState('');
    const [booking, setBooking] = useState(false);
    const [bookingFeedback, setBookingFeedback] = useState<string | null>(null);

    const doctorLookup = useMemo(() => {
        const map = new Map<number, DoctorProfile>();
        doctors.forEach((doctor) => map.set(doctor.id, doctor));
        return map;
    }, [doctors]);

    const selectedAvailability = useMemo(
        () => availability.find((item) => item.doctor_id === selectedDoctorId) ?? null,
        [availability, selectedDoctorId],
    );

    const loadAll = useCallback(
        async (showPullState = false) => {
            if (!token) {
                return;
            }

            if (showPullState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const [schedule, doctorList] = await Promise.all([fetchAppointments(token), fetchDoctors(token)]);
                setAppointments(schedule);
                setDoctors(doctorList);

                if (user?.role === 'patient') {
                    const [patient, slots] = await Promise.all([
                        fetchPatientMe(token),
                        fetchDoctorAvailability(token, specialtyFilter.trim() || undefined),
                    ]);
                    setPatientProfile(patient);
                    setAvailability(slots);

                    if (slots.length > 0) {
                        setSelectedDoctorId((prev) => prev ?? slots[0].doctor_id);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not load appointments.');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [token, user?.role, specialtyFilter],
    );

    useFocusEffect(
        useCallback(() => {
            void loadAll(false);
        }, [loadAll]),
    );

    const runAvailabilitySearch = async () => {
        if (!token || user?.role !== 'patient') {
            return;
        }

        setError(null);
        setRefreshing(true);
        try {
            const slots = await fetchDoctorAvailability(token, specialtyFilter.trim() || undefined);
            setAvailability(slots);
            setSelectedDoctorId(slots[0]?.doctor_id ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load availability.');
        } finally {
            setRefreshing(false);
        }
    };

    const createManualBooking = async () => {
        if (!token || !patientProfile || !selectedAvailability) {
            setBookingFeedback('Select a doctor slot first.');
            return;
        }

        setBooking(true);
        setBookingFeedback(null);
        try {
            await bookAppointment(token, {
                patient_id: patientProfile.id,
                doctor_id: selectedAvailability.doctor_id,
                scheduled_at: selectedAvailability.slot,
                notes: manualNotes.trim() || undefined,
            });
            setManualNotes('');
            setBookingFeedback('Appointment booked successfully.');
            await loadAll(true);
        } catch (err) {
            setBookingFeedback(err instanceof Error ? err.message : 'Booking failed.');
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1d6d5b" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <Pressable style={styles.refreshButton} onPress={() => loadAll(true)}>
                    <Text style={styles.refreshText}>{refreshing ? 'Refreshing...' : 'Refresh schedule'}</Text>
                </Pressable>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {user?.role === 'patient' ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Manual appointment booking</Text>
                        <Text style={styles.helperText}>Use these doctor slots directly from mobile when you do not want to book via chat.</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Filter by specialty (optional)"
                            placeholderTextColor="#6f7f79"
                            value={specialtyFilter}
                            onChangeText={setSpecialtyFilter}
                        />
                        <Pressable style={styles.secondaryButton} onPress={runAvailabilitySearch}>
                            <Text style={styles.secondaryButtonText}>Search availability</Text>
                        </Pressable>

                        <View style={styles.slotList}>
                            {availability.map((slot) => (
                                <Pressable
                                    key={`${slot.doctor_id}-${slot.slot}`}
                                    onPress={() => setSelectedDoctorId(slot.doctor_id)}
                                    style={[
                                        styles.slotCard,
                                        selectedDoctorId === slot.doctor_id && styles.slotCardSelected,
                                    ]}>
                                    <Text style={styles.slotDoctor}>{slot.doctor_name}</Text>
                                    <Text style={styles.slotMeta}>{slot.specialty}</Text>
                                    <Text style={styles.slotMeta}>{slot.location || 'Location not provided'}</Text>
                                    <Text style={styles.slotTime}>{formatDate(slot.slot)}</Text>
                                </Pressable>
                            ))}
                            {!availability.length ? <Text style={styles.helperText}>No slots available for this filter.</Text> : null}
                        </View>

                        <TextInput
                            style={[styles.input, styles.notesInput]}
                            multiline
                            placeholder="Notes for doctor (optional)"
                            placeholderTextColor="#6f7f79"
                            value={manualNotes}
                            onChangeText={setManualNotes}
                        />

                        <Pressable
                            style={[styles.primaryButton, booking && styles.buttonDisabled]}
                            onPress={createManualBooking}
                            disabled={booking}>
                            {booking ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Book selected slot</Text>}
                        </Pressable>

                        {selectedAvailability ? (
                            <Text style={styles.helperText}>
                                Selected: {selectedAvailability.doctor_name} at {formatDate(selectedAvailability.slot)}
                            </Text>
                        ) : null}
                        {bookingFeedback ? <Text style={styles.helperText}>{bookingFeedback}</Text> : null}
                    </View>
                ) : null}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>My appointments</Text>
                    {appointments.map((item) => {
                        const doctor = doctorLookup.get(item.doctor_id);
                        return (
                            <View style={styles.apptCard} key={item.id}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.apptHeading}>#{item.id}</Text>
                                    <Text style={[styles.statusPill, { color: statusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                                </View>
                                <Text style={styles.apptMeta}>{formatDate(item.scheduled_at)}</Text>
                                <Text style={styles.apptMeta}>
                                    {user?.role === 'patient'
                                        ? `Doctor: ${doctor?.full_name ?? `#${item.doctor_id}`}`
                                        : `Patient ID: ${item.patient_id}`}
                                </Text>
                                {item.notes ? <Text style={styles.apptNotes}>{item.notes}</Text> : null}
                            </View>
                        );
                    })}
                    {!appointments.length ? <Text style={styles.helperText}>No appointments found yet.</Text> : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#eef6f3',
    },
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef6f3',
    },
    content: {
        padding: 14,
        gap: 12,
    },
    refreshButton: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#bbd8ce',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f8fcfb',
    },
    refreshText: {
        color: '#295347',
        fontWeight: '600',
        fontSize: 13,
    },
    errorText: {
        color: '#a12637',
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d4e5de',
        backgroundColor: '#ffffff',
        padding: 12,
        gap: 10,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e4339',
    },
    helperText: {
        fontSize: 13,
        color: '#4a675f',
        lineHeight: 18,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cfe0da',
        borderRadius: 10,
        backgroundColor: '#f8fcfb',
        paddingHorizontal: 10,
        paddingVertical: 10,
        color: '#21433a',
    },
    notesInput: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    secondaryButton: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#b7d2c9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f3faf7',
    },
    secondaryButtonText: {
        color: '#2a5a4d',
        fontWeight: '600',
        fontSize: 13,
    },
    slotList: {
        gap: 8,
    },
    slotCard: {
        borderWidth: 1,
        borderColor: '#d2e3dc',
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#fcfefd',
    },
    slotCardSelected: {
        borderColor: '#1d6d5b',
        backgroundColor: '#f1faf7',
    },
    slotDoctor: {
        color: '#23483d',
        fontWeight: '700',
        fontSize: 14,
    },
    slotMeta: {
        color: '#4d6a62',
        fontSize: 12,
        marginTop: 2,
    },
    slotTime: {
        color: '#2b594d',
        fontSize: 13,
        marginTop: 4,
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#1d6d5b',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    buttonDisabled: {
        opacity: 0.8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    apptCard: {
        borderWidth: 1,
        borderColor: '#d5e4de',
        borderRadius: 10,
        padding: 10,
        gap: 4,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    apptHeading: {
        fontSize: 15,
        fontWeight: '700',
        color: '#23453c',
    },
    statusPill: {
        fontSize: 11,
        fontWeight: '700',
    },
    apptMeta: {
        color: '#4a655e',
        fontSize: 13,
    },
    apptNotes: {
        color: '#365b50',
        fontSize: 13,
        marginTop: 2,
    },
});
