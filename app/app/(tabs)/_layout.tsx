import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1d6d5b" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: user.role === 'doctor' ? 'Requests' : 'Assistant',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'sparkles' : 'sparkles-outline'} color={color} />
          ),
          headerTitle: user.role === 'doctor' ? 'Doctor Desk' : 'Care Assistant',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: user.role === 'patient' ? '/(tabs)/chat' : null,
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} color={color} />
          ),
          headerTitle: 'AI Triage Chat',
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'calendar' : 'calendar-outline'} color={color} />
          ),
          headerTitle: 'Appointments',
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          href: user.role === 'doctor' ? '/(tabs)/requests' : null,
          title: 'Requests',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'clipboard' : 'clipboard-outline'} color={color} />
          ),
          headerTitle: 'Patient Requests',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'person-circle' : 'person-circle-outline'} color={color} />
          ),
          headerTitle: 'Account',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
