import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { fetchAppointments } from '@/lib/api';
import type { Appointment } from '@/lib/types';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => appointments.filter((item) => item.status === 'pending').length,
    [appointments],
  );

  const nextAppointment = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );
    return sorted[0] ?? null;
  }, [appointments]);

  const loadSummary = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchAppointments(token);
      setAppointments(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboard details.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
    }, [loadSummary]),
  );

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#1d6d5b" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, user?.role === 'doctor' ? styles.heroDoctor : styles.heroPatient]}>
        <Text style={styles.heroKicker}>{user?.role === 'doctor' ? 'Doctor workspace' : 'Patient workspace'}</Text>
        <Text style={styles.heroTitle}>Welcome, {user?.full_name || user?.email}</Text>
        <Text style={styles.heroSubtitle}>
          {user?.role === 'doctor'
            ? 'Review incoming appointment requests and your complete care schedule.'
            : 'Use AI chat for symptom triage and book appointments in seconds.'}
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total appointments</Text>
          <Text style={styles.metricValue}>{appointments.length}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pending requests</Text>
          <Text style={styles.metricValue}>{pendingCount}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next appointment</Text>
        <Text style={styles.cardValue}>
          {nextAppointment ? formatDate(nextAppointment.scheduled_at) : 'No appointments yet'}
        </Text>
      </View>

      <View style={styles.actionGrid}>
        {user?.role === 'patient' ? (
          <>
            <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/chat')}>
              <Text style={styles.actionTitle}>Start AI chat</Text>
              <Text style={styles.actionSubtitle}>Describe symptoms and let the assistant suggest and book a slot.</Text>
            </Pressable>
            <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/appointments')}>
              <Text style={styles.actionTitle}>Schedule manually</Text>
              <Text style={styles.actionSubtitle}>Choose a doctor availability row and create an appointment.</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/requests')}>
              <Text style={styles.actionTitle}>Review requests</Text>
              <Text style={styles.actionSubtitle}>Inspect pending requests from patients and triaged bookings.</Text>
            </Pressable>
            <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/appointments')}>
              <Text style={styles.actionTitle}>Open schedule</Text>
              <Text style={styles.actionSubtitle}>Track every upcoming appointment assigned to your profile.</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f7f5',
  },
  content: {
    padding: 16,
    gap: 14,
    backgroundColor: '#f2f7f5',
  },
  heroCard: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  heroPatient: {
    backgroundColor: '#0f4a56',
  },
  heroDoctor: {
    backgroundColor: '#4a3c1c',
  },
  heroKicker: {
    color: '#d2ebe8',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 24,
  },
  heroSubtitle: {
    color: '#d9efec',
    lineHeight: 20,
    fontSize: 14,
  },
  errorText: {
    color: '#a12637',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d6e7e1',
    padding: 14,
    gap: 4,
  },
  metricLabel: {
    color: '#4b645d',
    fontSize: 12,
  },
  metricValue: {
    color: '#1b3f36',
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d6e7e1',
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    color: '#3f5f56',
    fontSize: 13,
    fontWeight: '600',
  },
  cardValue: {
    color: '#1b3f36',
    fontSize: 16,
    fontWeight: '600',
  },
  actionGrid: {
    gap: 10,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d6e7e1',
    padding: 14,
    gap: 4,
  },
  actionTitle: {
    color: '#214e43',
    fontWeight: '700',
    fontSize: 15,
  },
  actionSubtitle: {
    color: '#48675e',
    fontSize: 13,
    lineHeight: 18,
  },
});
