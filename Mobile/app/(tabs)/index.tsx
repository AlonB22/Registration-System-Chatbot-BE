import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInput as RNTextInput,
  ToastAndroid,
  type ViewStyle,
  View,
} from 'react-native';

type InputShellProps = {
  children: ReactNode;
  isFocused: boolean;
  onFocusPress: () => void;
  style: StyleProp<ViewStyle>;
  focusedStyle: StyleProp<ViewStyle>;
};

function InputShell({
  children,
  isFocused,
  onFocusPress,
  style,
  focusedStyle,
}: InputShellProps) {
  if (Platform.OS === 'android') {
    return (
      <Pressable onPress={onFocusPress} style={[style, isFocused && focusedStyle]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[style, isFocused && focusedStyle]}>{children}</View>;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const emailInputRef = useRef<RNTextInput>(null);
  const passwordInputRef = useRef<RNTextInput>(null);

  const isLoginDisabled = email.trim() === '' || password.trim() === '';
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const toastServerUrl =
    process.env.EXPO_PUBLIC_TOAST_SERVER_URL || 'http://localhost:3001';

  function showToast(message: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
      return;
    }
    Alert.alert('Notice', message);
  }

  async function getToastMessage(mode: 'login' | 'registration') {
    const endpoint = mode === 'login' ? '/api/login-toast' : '/api/registration-toast';
    const fallback = mode === 'login' ? 'Welcome back.' : 'Registration complete.';

    try {
      const response = await fetch(`${toastServerUrl}${endpoint}`);

      if (!response.ok) {
        throw new Error('Toast API request failed');
      }

      const payload = await response.json();
      return payload?.message || fallback;
    } catch {
      return fallback;
    }
  }

  async function handleLogin() {
    if (isLoggingIn || isLoginDisabled) {
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 404) {
        showToast('User not found. Please register to log in.');
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Login failed.');
      }

      const message = await getToastMessage('login');
      showToast(message);
    } catch (error: any) {
      showToast(error?.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleRegister() {
    if (isRegistering) {
      return;
    }

    if (isLoginDisabled) {
      showToast('Please enter email and password before registering.');
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Registration failed.');
      }

      const message = await getToastMessage('registration');
      showToast(message);
    } catch (error: any) {
      showToast(error?.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.keyboardRoot}>
        <View style={styles.container}>
          <View style={styles.logoBox}>
            <Image
              source={require('@/assets/images/logo-square.svg')}
              style={styles.logoSquare}
              contentFit="contain"
            />
            <Image
              source={require('@/assets/images/logo-s.svg')}
              style={styles.logoS}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>Log in</Text>

          <InputShell
            onFocusPress={() => emailInputRef.current?.focus()}
            isFocused={focusedField === 'email'}
            style={styles.inputShell}
            focusedStyle={styles.inputShellFocused}>
            <Image
              source={require('@/assets/images/email-icon.svg')}
              style={styles.inputLeadingIcon}
              contentFit="contain"
            />
            <TextInput
              ref={emailInputRef}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="Email"
              placeholderTextColor="#858585"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </InputShell>

          <InputShell
            onFocusPress={() => passwordInputRef.current?.focus()}
            isFocused={focusedField === 'password'}
            style={styles.inputShell}
            focusedStyle={styles.inputShellFocused}>
            <Image
              source={require('@/assets/images/lock-icon.svg')}
              style={styles.inputLeadingIcon}
              contentFit="contain"
            />
            <TextInput
              ref={passwordInputRef}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="Password"
              placeholderTextColor="#858585"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#909090" />
            </Pressable>
          </InputShell>

          <Pressable style={styles.forgotButton}>
            <Text numberOfLines={1} style={styles.forgotText}>
              Forgot password?
            </Text>
          </Pressable>
          
          <Pressable
            onPress={handleLogin}
            disabled={isLoginDisabled || isLoggingIn}
            style={[
              styles.loginButton,
              (isLoginDisabled || isLoggingIn) && styles.loginButtonDisabled,
            ]}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <Pressable style={styles.socialButton}>
              <Image
                source={require('@/assets/images/google-logo.svg')}
                style={styles.googleLogoIcon}
                contentFit="contain"
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>

            <Pressable style={styles.socialButton}>
              <FontAwesome5 name="facebook" size={20} color="#1877F2" />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </Pressable>
          </View>

          <Text style={styles.footerCopy}>Have no account yet?</Text>
          <Pressable
            onPress={handleRegister}
            disabled={isRegistering}
            style={[styles.registerButton, isRegistering && styles.registerButtonDisabled]}>
            <Text style={styles.registerButtonText}>Register</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  keyboardRoot: {
    flex: 1,
  },
  container: {
    width: 300,
    alignSelf: 'center',
    paddingTop: 74,
  },
  logoBox: {
    width: 49.23067855834961,
    height: 48.99991226196289,
    alignSelf: 'center',
    position: 'relative',
    opacity: 1,
  },
  logoSquare: {
    width: 49.23067855834961,
    height: 48.99991226196289,
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 1,
  },
  logoS: {
    width: 17.23257064819336,
    height: 21.4434814453125,
    position: 'absolute',
    top: 13.78,
    left: 16.72,
    opacity: 1,
  },
  title: {
    marginTop: 29,
    marginBottom: 34,
    alignSelf: 'center',
    color: '#3949AB',
    fontFamily: 'Lato_700Bold',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    opacity: 1,
  },
  inputShell: {
    width: 300,
    height: 40,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    borderRadius: 10,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    opacity: 1,
  },
  inputShellFocused: {
    borderColor: '#5769D4',
    shadowColor: '#5769D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 1,
  },
  input: {
    flex: 1,
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: 'Lato_400Regular',
    includeFontPadding: false,
  },
  inputLeadingIcon: {
    width: 24,
    height: 24,
  },
  forgotButton: {
    minWidth: 110,
    alignSelf: 'flex-end',
    marginBottom: 12,
    opacity: 1,
  },
  forgotText: {
    color: '#3949AB',
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: 0,
  },
  loginButton: {
    width: 300,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#3949AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#9BA4D8',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Lato_700Bold',
  },
  dividerRow: {
    marginTop: 12,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dividerLine: {
    width: 83.5,
    height: 1,
    backgroundColor: '#E0E3F0',
  },
  dividerText: {
    color: '#767676',
    fontSize: 17,
    fontWeight: '500',
    fontFamily: 'Lato_700Bold',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialButton: {
    width: 145,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3949AB',
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButtonText: {
    color: '#5065C0',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Lato_700Bold',
  },
  googleLogoIcon: {
    width: 20,
    height: 20,
  },
  footerCopy: {
    alignSelf: 'center',
    marginBottom: 18,
    color: '#808080',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lato_700Bold',
    lineHeight: 14,
    letterSpacing: 0,
    textAlignVertical: 'center',
  },
  registerButton: {
    width: 300,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3949AB',
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#5065C0',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Lato_700Bold',
  },
});
