import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useMobileAuth } from '../context/AuthContext';
import { mobileApiClient } from '../api/client';
import { FolderKanban, LogIn, Sparkles } from 'lucide-react-native';
import { theme } from '../theme/colors';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useMobileAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await mobileApiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });

      if (res.data.success) {
        await login(res.data.data.token, res.data.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@example.com');
    setPassword('Password123!');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FolderKanban size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>Parity</Text>
          <Text style={styles.subtitle}>Mobile Project & Task Management</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="demo@example.com"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnContent}>
                <LogIn size={18} color="#ffffff" style={styles.btnIcon} />
                <Text style={styles.btnText}>Sign In</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoBtn} onPress={fillDemoCredentials}>
            <Sparkles size={16} color="#818cf8" style={styles.btnIcon} />
            <Text style={styles.demoBtnText}>Fill Demo Account (One-Tap)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.navy,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.navy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: theme.teal,
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: theme.rosewoodBg,
    borderWidth: 1,
    borderColor: theme.rosewoodBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: theme.rosewood,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.teal,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.cardSubtle,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.navy,
    fontSize: 14,
    marginBottom: 18,
  },
  loginBtn: {
    backgroundColor: theme.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  demoBtn: {
    backgroundColor: theme.skyLight,
    borderWidth: 1,
    borderColor: theme.sky,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 14,
  },
  demoBtnText: {
    color: theme.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: theme.teal,
    fontSize: 13,
  },
  signupText: {
    color: theme.navy,
    fontSize: 13,
    fontWeight: '700',
  },
});
