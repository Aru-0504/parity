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
import { UserPlus, ArrowLeft } from 'lucide-react-native';
import { theme } from '../theme/colors';

export const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useMobileAuth();

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await mobileApiClient.post('/auth/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (res.data.success) {
        await login(res.data.data.token, res.data.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={theme.navy} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Parity to organize your workload</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Alex Rivera"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="alex@example.com"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD (MIN 6 CHARACTERS)</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnContent}>
                <UserPlus size={18} color="#ffffff" style={styles.btnIcon} />
                <Text style={styles.btnText}>Create Account</Text>
              </View>
            )}
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    color: theme.teal,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.navy,
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
  submitBtn: {
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
});
