import { useEffect, useState } from 'react'
import './App.css'
import authIllustration from './assets/auth-illustration.png'
import logoSquare from './assets/square.svg'
import logoS from './assets/logo-s.svg'
import emailIcon from './assets/email-icon.svg'
import lockIcon from './assets/lock-icon.svg'

const USER_NOT_FOUND_TOAST = {
  type: 'error',
  message: 'User not found. Please register to log in.',
}

function EyeIcon({ isOpen }) {
  if (isOpen) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M2.7 12s3.5-6 9.3-6 9.3 6 9.3 6-3.5 6-9.3 6-9.3-6-9.3-6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 3 21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.6 6.2A10.2 10.2 0 0 1 12 6c5.8 0 9.3 6 9.3 6a16 16 0 0 1-2.7 3.3M6.3 8.3A16 16 0 0 0 2.7 12s3.5 6 9.3 6c1.1 0 2.1-.2 3-.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.3 10.3a3 3 0 0 0 4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.6 12.2c0-.7-.1-1.3-.2-2h-9.3v3.8h5.3a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.7 3-4.3 3-7.5Z"
        fill="#4285F4"
      />
      <path
        d="M12.1 21.9c2.7 0 5-1 6.6-2.7l-3.2-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.2V16c1.6 3.4 5 5.9 8.9 5.9Z"
        fill="#34A853"
      />
      <path
        d="M6.5 13.4a5.8 5.8 0 0 1 0-3.7V7.1H3.2a10 10 0 0 0 0 9l3.3-2.7Z"
        fill="#FBBC05"
      />
      <path
        d="M12.1 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 3.2 7l3.3 2.7c.8-2.4 3-3.6 5.6-3.6Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.7-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"
        fill="#1877F2"
      />
    </svg>
  )
}

function App() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [toast, setToast] = useState(null)
  const isLoginDisabled = email.trim() === '' || password.trim() === ''
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
  const toastServerUrl = import.meta.env.VITE_TOAST_SERVER_URL || 'http://localhost:3001'
  const showUserNotFoundToast = () => setToast({ ...USER_NOT_FOUND_TOAST })

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = setTimeout(() => {
      setToast(null)
    }, 4500)

    return () => clearTimeout(timeoutId)
  }, [toast])

  async function getToastMessage(mode = 'registration') {
    const endpoint =
      mode === 'login' ? '/api/login-toast' : '/api/registration-toast'
    const fallback =
      mode === 'login' ? 'Welcome back.' : 'Registration complete.'

    try {
      const response = await fetch(`${toastServerUrl}${endpoint}`)
      if (!response.ok) {
        throw new Error('Toast server request failed')
      }

      const payload = await response.json()
      return payload?.message || fallback
    } catch (error) {
      return fallback
    }
  }

  async function handleLogin() {
    if (isLoggingIn) {
      return
    }

    if (isLoginDisabled) {
      setToast({
        type: 'error',
        message: 'Please enter email and password.',
      })
      return
    }

    setIsLoggingIn(true)

    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const apiError = payload?.error || ''

        if (response.status === 404 || /user not found/i.test(apiError)) {
          showUserNotFoundToast()
          return
        }

        throw new Error(apiError || 'Login failed.')
      }

      const message = await getToastMessage('login')
      setToast({ type: 'success', message })
    } catch (error) {
      if (/user not found/i.test(error?.message || '')) {
        showUserNotFoundToast()
        return
      }

      setToast({
        type: 'error',
        message: error?.message || 'Login failed.',
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleRegister() {
    if (isRegistering) {
      return
    }

    if (isLoginDisabled) {
      setToast({
        type: 'error',
        message: 'Please enter email and password before registering.',
      })
      return
    }

    setIsRegistering(true)

    try {
      const response = await fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Registration failed.')
      }

      const message = await getToastMessage('registration')
      setToast({ type: 'success', message })
    } catch (error) {
      setToast({
        type: 'error',
        message: error?.message || 'Registration failed.',
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <main className="auth-page">
      {toast && (
        <div className={`app-toast app-toast-${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <section className="auth-card" aria-label="Registration form">
        <aside className="auth-visual">
          <div className="auth-logo-box" aria-label="Brand logo">
            <img className="auth-logo-frame" src={logoSquare} alt="" aria-hidden="true" />
            <img className="auth-logo-s" src={logoS} alt="S logo" />
          </div>
          <div className="auth-illustration-backdrop" aria-hidden="true" />
          <img
            className="auth-illustration"
            src={authIllustration}
            alt="Illustration of a person completing a form"
          />
          <p className="auth-visual-caption-main">Welcome aboard my friend</p>
          <p className="auth-visual-caption-sub">just a couple of clicks and we start</p>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-logo-box auth-logo-box-mobile" aria-hidden="true">
            <img className="auth-logo-s" src={logoS} alt="" />
          </div>
          <h1 className="auth-title">Log in</h1>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              handleLogin()
            }}
          >
            <div className="input-shell">
              <span className="input-icon">
                <img src={emailIcon} alt="" aria-hidden="true" className="field-icon-img" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="input-shell">
              <span className="input-icon">
                <img src={lockIcon} alt="" aria-hidden="true" className="field-icon-img" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="icon-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((previousValue) => !previousValue)}
              >
                <EyeIcon isOpen={showPassword} />
              </button>
            </div>

            <button type="button" className="forgot-password">
              Forgot password?
            </button>

            <button type="submit" className="primary-action" disabled={isLoginDisabled || isLoggingIn}>
              Log in
            </button>

            <div className="or-divider" aria-hidden="true">
              <span>Or</span>
            </div>

            <div className="social-actions">
              <button type="button" className="social-action">
                <GoogleIcon />
                Google
              </button>
              <button type="button" className="social-action">
                <FacebookIcon />
                Facebook
              </button>
            </div>

            <div className="auth-footer">
              <p>Have no account yet?</p>
              <button
                type="button"
                className="register-link"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                Register
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}

export default App
