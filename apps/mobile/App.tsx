import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from './src/theme/colors';

import { AuthProvider, useMobileAuth } from './src/context/AuthContext';
import { NetworkBanner } from './src/components/NetworkBanner';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { ProjectDetailScreen } from './src/screens/ProjectDetailScreen';
import { TasksScreen } from './src/screens/TasksScreen';

import { LayoutDashboard, FolderKanban, CheckSquare } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProjectsStack = createNativeStackNavigator();

const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.canvas,
    card: theme.card,
    text: theme.textPrimary,
    border: theme.border,
    primary: theme.navy,
  },
};

function ProjectsStackNavigator() {
  return (
    <ProjectsStack.Navigator screenOptions={{ headerShown: false }}>
      <ProjectsStack.Screen name="ProjectsList" component={ProjectsScreen} />
      <ProjectsStack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    </ProjectsStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: theme.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.navy,
        tabBarInactiveTintColor: theme.teal,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsStackNavigator}
        options={{
          tabBarLabel: 'Projects',
          tabBarIcon: ({ color, size }) => <FolderKanban size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useMobileAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.navy} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={CustomTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <NetworkBanner />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.canvas,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
