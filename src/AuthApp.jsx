import { useEffect, useState } from 'react'
import { login, registerCustomer, registerOrganization, resendOtp, verifyOtp, verifyOrganizationOtp } from './api/auth.js'
import CustomerDashboard from './dashboard/CustomerDashboard.jsx'
import { useAuth } from './state/AuthContext.jsx'

const CUSTOMER_FIELDS = [
  ['fullName', 'Full name', 'text', 'Ama Mensah'],
  ['email', 'Email address', 'email', 'you@example.com'],
  ['phone', 'Phone number', 'tel', '+233 20 123 4567'],
]

const ORGANIZATION_FIELDS = [
  ['organizationName', 'Organization name', 'text', 'Clean Ghana Services', 150],
  ['registrationNumber', 'Registration number', 'text', 'REG-123456', 100, false],
  ['contactEmail', 'Contact email', 'email', 'contact@organization.com', 254],
  ['contactPhone', 'Contact phone', 'tel', '+233201234567', undefined, true, '^\\+?[0-9]{7,15}$'],
]

const ORGANIZATION_AREAS = [
  ['description', 'About the organization', 'A short introduction to your organization', 5000, false],
  ['servicesDescription', 'Services offered', 'Describe the sanitation services you provide', 5000],
  ['businessAddress', 'Business address', 'Street, city, region', 500],
]

const RESEND_COOLDOWN_SECONDS = 60
const RESEND_RETRY_COOLDOWN_SECONDS = 30

function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete, error, required = true, maxLength, pattern, hint }) {
  const [visible, setVisible] = useState(false)
  const inputType = type === 'password' && visible ? 'text' : type
  return <div className="field">
    <label htmlFor={id}>{label}{!required && <span className="optional"> · Optional</span>}</label>
    <div className={`input-wrap ${error ? 'has-error' : ''}`}>
      <input id={id} name={id} type={inputType} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} required={required} maxLength={maxLength} pattern={pattern} />
      {type === 'password' && <button className="reveal-button" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button>}
    </div>
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
  </div>
}

function TextArea({ id, label, value, onChange, placeholder, error, maxLength, required = true }) {
  return <div className="field">
    <label htmlFor={id}>{label}{!required && <span className="optional"> · Optional</span>}</label>
    <textarea id={id} name={id} value={value} onChange={onChange} placeholder={placeholder} rows={3} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} required={required} />
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
  </div>
}

function ChannelSelect({ value, onChange }) {
  return <fieldset className="channel-field">
    <legend>Send verification code by</legend>
    <div className="channel-options">
      {['EMAIL', 'SMS'].map((channel) => <label key={channel} className={`channel-option ${value === channel ? 'selected' : ''}`}>
        <input type="radio" name="otpChannel" value={channel} checked={value === channel} onChange={onChange} />
        <span className="radio-mark" aria-hidden="true" />
        <span><strong>{channel === 'EMAIL' ? 'Email' : 'Text message'}</strong><small>{channel === 'EMAIL' ? 'Send a code to your inbox' : 'Send a code to your phone'}</small></span>
      </label>)}
    </div>
  </fieldset>
}

function ErrorBanner({ children }) {
  if (!children) return null
  return <div className="error-banner" role="alert"><span className="error-icon" aria-hidden="true">!</span><span>{children}</span></div>
}

function initialCustomerRegistration() {
  return { fullName: '', email: '', phone: '', password: '', otpChannel: 'EMAIL' }
}

function initialOrganizationRegistration() {
  return { organizationName: '', registrationNumber: '', description: '', servicesDescription: '', contactEmail: '', contactPhone: '', businessAddress: '', otpChannel: 'EMAIL' }
}

function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }

function responseError(error, isLogin = false) {
  if (error.status === 401 && isLogin) return 'The email or password is incorrect.'
  if (error.status === 500 || !error.status) return error.message || 'We couldn’t reach the service. Check your connection and try again.'
  return error.message || 'Please review your details and try again.'
}

export default function AuthApp() {
  const { auth, authenticate, signOut } = useAuth()
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [screen, setScreen] = useState(() => window.location.pathname === '/login' ? 'login' : 'register')
  const [kind, setKind] = useState('customer')
  const [customerRegistration, setCustomerRegistration] = useState(initialCustomerRegistration)
  const [organizationRegistration, setOrganizationRegistration] = useState(initialOrganizationRegistration)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [pending, setPending] = useState(null)
  const [organizationSummary, setOrganizationSummary] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [notice, setNotice] = useState('')
  const [apiError, setApiError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const registration = kind === 'customer' ? customerRegistration : organizationRegistration

  function navigate(path, replace = false) {
    if (window.location.pathname !== path) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
    }
    setPathname(path)
  }

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const isCustomerRoute = pathname.startsWith('/customer/')
    const isOrganizationRoute = pathname.startsWith('/organization/')
    if (isCustomerRoute && auth?.user?.role === 'CUSTOMER') return

    if (isOrganizationRoute) {
      window.location.replace(auth?.user?.role === 'CUSTOMER' ? '/customer/dashboard' : '/login')
      return
    }

    if (isCustomerRoute) {
      window.location.replace('/login')
      return
    }

    if (auth?.user?.role === 'CUSTOMER' && ['/', '/login', '/register'].includes(pathname)) {
      window.location.replace('/customer/dashboard')
    }
  }, [pathname, auth])

  useEffect(() => {
    if (screen !== 'verify' || (secondsLeft <= 0 && resendCooldown <= 0)) return undefined
    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1))
      setResendCooldown((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [screen, secondsLeft, resendCooldown])

  const updateRegistration = (event) => {
    const { name, value } = event.target
    const setForm = kind === 'customer' ? setCustomerRegistration : setOrganizationRegistration
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setApiError('')
  }

  function validateRegistration() {
    const errors = {}
    const required = kind === 'customer'
      ? ['fullName', 'email', 'phone', 'password']
      : ['organizationName', 'servicesDescription', 'contactEmail', 'contactPhone', 'businessAddress']
    for (const field of required) if (!registration[field].trim()) errors[field] = 'This field is required.'
    if (kind === 'customer' && registration.email && !validateEmail(registration.email)) errors.email = 'Enter a valid email address.'
    if (kind === 'organization') {
      const lengthLimits = { organizationName: 150, registrationNumber: 100, description: 5000, servicesDescription: 5000, contactEmail: 254, businessAddress: 500 }
      for (const [field, maxLength] of Object.entries(lengthLimits)) {
        if (registration[field].length > maxLength) errors[field] = `Must be ${maxLength} characters or fewer.`
      }
      if (registration.contactEmail && !validateEmail(registration.contactEmail)) errors.contactEmail = 'Enter a valid email address.'
      if (registration.contactPhone && !/^\+?[0-9]{7,15}$/.test(registration.contactPhone)) {
        errors.contactPhone = 'must be 7-15 digits, optionally starting with +'
      }
    }
    if (!['EMAIL', 'SMS'].includes(registration.otpChannel)) errors.otpChannel = 'Choose email or text message.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submitRegistration(event) {
    event.preventDefault()
    if (!validateRegistration()) return
    setBusy(true); setApiError(''); setFieldErrors({})
    const payload = kind === 'customer'
      ? { fullName: registration.fullName.trim(), email: registration.email.trim(), phone: registration.phone.trim(), password: registration.password, otpChannel: registration.otpChannel }
      : {
        organizationName: registration.organizationName.trim(),
        ...(registration.registrationNumber.trim() ? { registrationNumber: registration.registrationNumber.trim() } : {}),
        ...(registration.description.trim() ? { description: registration.description.trim() } : {}),
        servicesDescription: registration.servicesDescription.trim(),
        contactEmail: registration.contactEmail.trim(),
        contactPhone: registration.contactPhone.trim(),
        businessAddress: registration.businessAddress.trim(),
        otpChannel: registration.otpChannel,
      }
    try {
      const result = kind === 'customer' ? await registerCustomer(payload) : await registerOrganization(payload)
      setPending({ ...result, kind, verificationEmail: kind === 'organization' ? payload.contactEmail : result.email })
      setSecondsLeft(Math.max(0, Number(result.otpExpiresInSeconds) || 0))
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      if (kind === 'customer') setCustomerRegistration((current) => ({ ...current, password: '' }))
      setOtp(''); setScreen('verify')
    } catch (error) {
      setApiError(responseError(error))
      setFieldErrors(error.fieldErrors || {})
    } finally { setBusy(false) }
  }

  async function submitResend() {
    if (!pending || busy || resendCooldown > 0) return
    setBusy(true); setResending(true); setApiError(''); setFieldErrors({})
    try {
      const result = await resendOtp({ email: pending.verificationEmail })
      setPending((current) => ({ ...current, ...result, kind: current.kind, verificationEmail: current.verificationEmail }))
      setSecondsLeft(Math.max(0, Number(result.otpExpiresInSeconds) || 0))
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setOtp('')
    } catch (error) {
      setApiError(responseError(error))
      if (error.status === 429 || /too soon|cooldown|rate limit/i.test(error.message)) {
        setResendCooldown(RESEND_RETRY_COOLDOWN_SECONDS)
      }
    } finally { setBusy(false); setResending(false) }
  }

  async function submitOtp(event) {
    event.preventDefault()
    if (secondsLeft <= 0) { setApiError('This verification code has expired. Request a new code to continue.'); return }
    if (!/^\d{6}$/.test(otp)) { setFieldErrors({ otp: 'Enter the six-digit verification code.' }); return }
    setBusy(true); setApiError(''); setFieldErrors({})
    try {
      if (pending.kind === 'organization') {
        const result = await verifyOrganizationOtp({ email: pending.verificationEmail, otp })
        if (String(result?.verificationStatus || '').toUpperCase() !== 'PENDING' || result?.acceptingRequests !== false || !result?.organizationName?.trim()) {
          setApiError('Your code was verified, but the server did not confirm the expected pending approval status. Please contact support before continuing.')
          return
        }
        setOrganizationSummary(result)
        setScreen('organization-complete')
      } else {
        const result = await verifyOtp({ email: pending.verificationEmail, otp })
        authenticate(result)
        if (result.user?.role === 'CUSTOMER') navigate('/customer/dashboard', true)
        else setScreen('complete')
      }
    } catch (error) {
      setApiError(responseError(error))
    } finally { setBusy(false) }
  }

  async function submitLogin(event) {
    event.preventDefault()
    const errors = {}
    if (!loginForm.email.trim()) errors.email = 'Enter your email address.'
    else if (!validateEmail(loginForm.email)) errors.email = 'Enter a valid email address.'
    if (!loginForm.password) errors.password = 'Enter your password.'
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setBusy(true); setApiError('')
    try {
      const result = await login({ email: loginForm.email.trim(), password: loginForm.password })
      authenticate(result)
      setLoginForm((current) => ({ ...current, password: '' }))
      if (result.user?.role === 'CUSTOMER') navigate('/customer/dashboard', true)
      else setScreen('complete')
    } catch (error) {
      setApiError(responseError(error, true))
      setFieldErrors(error.fieldErrors || {})
    } finally { setBusy(false) }
  }

  function backToRegistration() {
    setScreen('register'); setPending(null); setOtp(''); setApiError(''); setFieldErrors({})
    setNotice('Your registration details are still here. You can review them and start again.')
  }

  function toLogin() { setScreen('login'); navigate('/login'); setApiError(''); setFieldErrors({}); setNotice('') }
  function toRegister() { setScreen('register'); navigate('/register'); setApiError(''); setFieldErrors({}); setNotice('') }

  const role = auth?.user?.role
  const isCustomerRoute = pathname.startsWith('/customer/')

  if (isCustomerRoute && auth?.user?.role === 'CUSTOMER') {
    return <CustomerDashboard user={auth.user} currentPath={pathname} onNavigate={navigate} onLogout={() => { signOut(); setScreen('login'); navigate('/login', true) }} />
  }

  return <main className="page-shell">
    <header className="topbar">
      <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); toLogin() }} aria-label="Sanitation Management home">
        <img className="brand-logo" src="/green-garbage-truck-logo.png" alt="" />
        <span className="brand-copy"><strong><span>Sani</span><span>Link</span></strong><small>Connecting Communities to Cleaner Living.</small></span>
      </a>
      {!auth && <div className="topbar-prompt">{screen === 'login' ? <>New to the platform? <button type="button" onClick={toRegister}>Create account</button></> : <>Already registered? <button type="button" onClick={toLogin}>Sign in</button></>}</div>}
    </header>

    <div className="auth-layout">
      <section className="intro-panel" aria-label="Service information">
        <div className="intro-content">
          <h1>A Cleaner Community Starts With Us. Clean Today, Healthy Tomorrow.</h1>
          <p className="intro-text">Connecting communities with reliable sanitation services to make waste management easier, smarter, and more accessible.</p>
          <div className="truck-image-stage">
            <img className="intro-truck-main" src="/intro-garbage-truck.png" alt="Bright green sanitation truck" />
            <img className="intro-truck-overlay" src="/sanitation-crew-truck.png" alt="Sanitation worker operating a collection truck" />
          </div>
        </div>
      </section>

      <section className="form-panel" aria-live="polite">
        <div className="form-content">
          {screen === 'organization-complete' && organizationSummary ? <>
            <div className="success-symbol" aria-hidden="true">✓</div>
            <p className="section-kicker">Organization registered</p>
            <h2>Your organization is awaiting administrator approval.</h2>
            <p className="form-subtitle">Your registration has been submitted successfully. An administrator will review your organization's information before it can start accepting service requests.</p>
            <div className="signed-in-detail organization-confirmation-card">
              <span>Organization</span>
              <strong>{organizationSummary.organizationName}</strong>
              <div className="organization-status-row"><span>Verification status</span><strong className="pending-status-badge">{organizationSummary.verificationStatus}</strong></div>
              <div className="organization-status-row"><span>Service requests</span><strong className="service-unavailable-status">Not accepting</strong></div>
            </div>
            <button className="primary-button full-button" type="button" onClick={toLogin}>Back to sign in</button>
          </> : auth || screen === 'complete' ? <>
            <div className="success-symbol" aria-hidden="true">✓</div>
            <p className="section-kicker">You’re signed in</p>
            <h2>{`Welcome${auth?.user?.fullName ? `, ${auth.user.fullName.split(' ')[0]}` : ' back'}.`}</h2>
            <p className="form-subtitle">{role === 'ADMIN' ? 'You’re signed in with administrator access.' : 'Your account is ready to use.'}</p>
            <div className="signed-in-detail"><span>Signed in as</span><strong>{auth?.user?.email}</strong><small>{role || 'Account'}</small></div>
            <button className="secondary-button full-button" type="button" onClick={() => { signOut(); setScreen('login'); setApiError('') }}>Sign out</button>
          </> : screen === 'verify' && pending ? <>
            <button className="back-link" type="button" onClick={backToRegistration}>← Back to registration</button>
            <p className="section-kicker">One last step</p>
            <h2>Verify your account</h2>
            <p className="form-subtitle">{pending.message} We sent it by <strong>{pending.channel}</strong> to <strong>{pending.sentTo}</strong>. Enter the code below to finish setting up your account.</p>
            {notice && <p className="notice-banner">{notice}</p>}
            <ErrorBanner>{apiError}</ErrorBanner>
            {secondsLeft <= 0 && <p className="expired-note" role="status">This code has expired. Request a new one below to continue.</p>}
            <form onSubmit={submitOtp} noValidate>
              <div className="field otp-field">
                <label htmlFor="otp">Six-digit verification code</label>
                <input id="otp" className="otp-input" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors({}); setApiError('') }} onPaste={(event) => { const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (text) { event.preventDefault(); setOtp(text); setFieldErrors({}); setApiError('') } }} aria-invalid={Boolean(fieldErrors.otp)} aria-describedby={fieldErrors.otp ? 'otp-error' : 'otp-help'} placeholder="000000" required />
                {fieldErrors.otp && <p className="field-error" id="otp-error">{fieldErrors.otp}</p>}
                <p className="field-hint" id="otp-help">{secondsLeft > 0 ? <>Code expires in <strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</strong></> : 'The verification window has ended.'}</p>
              </div>
              <button className="primary-button full-button" type="submit" disabled={busy || secondsLeft <= 0}>{busy ? <><span className="spinner"/> Verifying…</> : 'Verify account'}</button>
            </form>
            <p className="form-footnote center">Didn’t get a code? Check your spam folder.{' '}
              <button className="inline-link" type="button" onClick={submitResend} disabled={busy || resendCooldown > 0}>
                {resending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')}` : 'Resend code'}
              </button>
            </p>
          </> : screen === 'login' ? <>
            <p className="section-kicker">Welcome back</p>
            <h2>Sign in to your account</h2>
            <p className="form-subtitle">Use the email and password associated with your account.</p>
            {notice && <p className="notice-banner">{notice}</p>}
            <ErrorBanner>{apiError}</ErrorBanner>
            <form onSubmit={submitLogin} noValidate>
              <Field id="email" label="Email address" type="email" value={loginForm.email} onChange={(event) => { setLoginForm({ ...loginForm, email: event.target.value }); setFieldErrors({ ...fieldErrors, email: '' }) }} placeholder="you@example.com" autoComplete="email" error={fieldErrors.email} />
              <Field id="password" label="Password" type="password" value={loginForm.password} onChange={(event) => { setLoginForm({ ...loginForm, password: event.target.value }); setFieldErrors({ ...fieldErrors, password: '' }) }} placeholder="Enter your password" autoComplete="current-password" error={fieldErrors.password} />
              <button className="primary-button full-button form-submit" type="submit" disabled={busy}>{busy ? <><span className="spinner"/> Signing in…</> : 'Sign in'}</button>
            </form>
            <p className="form-footnote center">New to the platform? <button className="inline-link" type="button" onClick={toRegister}>Create an account</button></p>
          </> : <>
            <p className="section-kicker">Create your account</p>
            <h2>Get started with sanitation services</h2>
            <p className="form-subtitle">Choose how you’ll use the platform.</p>
            {notice && <p className="notice-banner">{notice}</p>}
            <div className="account-tabs" role="tablist" aria-label="Account type">
              <button id="customer-tab" className={kind === 'customer' ? 'active' : ''} type="button" role="tab" aria-selected={kind === 'customer'} onClick={() => { setKind('customer'); setFieldErrors({}); setApiError('') }}>Customer</button>
              <button id="organization-tab" className={kind === 'organization' ? 'active' : ''} type="button" role="tab" aria-selected={kind === 'organization'} onClick={() => { setKind('organization'); setFieldErrors({}); setApiError('') }}>Organization</button>
            </div>
            <ErrorBanner>{apiError}</ErrorBanner>
            <form onSubmit={submitRegistration} noValidate>
              {kind === 'customer' && <div className="form-section">
                {CUSTOMER_FIELDS.map(([id, label, type, placeholder]) => <Field key={id} id={id} label={label} type={type} value={registration[id]} onChange={updateRegistration} placeholder={placeholder} autoComplete={id === 'fullName' ? 'name' : id === 'email' ? 'email' : 'tel'} error={fieldErrors[id]} />)}
                <Field id="password" label="Password" type="password" value={registration.password} onChange={updateRegistration} placeholder="Choose a password" autoComplete="new-password" error={fieldErrors.password} />
              </div>}
              {kind === 'organization' && <div className="form-section organization-section">
                <p className="form-section-title">Organization details</p>
                {ORGANIZATION_FIELDS.map(([id, label, type, placeholder, maxLength, required = true, pattern]) => <Field key={id} id={id} label={label} type={type} value={registration[id]} onChange={updateRegistration} placeholder={placeholder} autoComplete={id === 'contactEmail' ? 'email' : id === 'contactPhone' ? 'tel' : undefined} error={fieldErrors[id]} required={required} maxLength={maxLength} pattern={pattern} hint={id === 'contactEmail' ? 'This is the email used to verify your organization registration.' : undefined} />)}
                {ORGANIZATION_AREAS.map(([id, label, placeholder, maxLength, required = true]) => <TextArea key={id} id={id} label={label} value={registration[id]} onChange={updateRegistration} placeholder={placeholder} error={fieldErrors[id]} maxLength={maxLength} required={required} />)}
              </div>}
              <ChannelSelect value={registration.otpChannel} onChange={updateRegistration} />
              {fieldErrors.otpChannel && <p className="field-error">{fieldErrors.otpChannel}</p>}
              <p className="field-hint channel-hint">{kind === 'organization' ? 'We’ll send a one-time code to your selected contact method. Admin approval is still required before your organization can accept service requests.' : 'We’ll send a one-time code to your selected contact method. Your account is only created after you verify it.'}</p>
              <button className="primary-button full-button form-submit" type="submit" disabled={busy}>{busy ? <><span className="spinner"/> Creating account…</> : 'Continue to verification'}</button>
            </form>
            <p className="form-footnote center">Already have an account? <button className="inline-link" type="button" onClick={toLogin}>Sign in</button></p>
          </>}
        </div>
      </section>
    </div>
    <footer className="mobile-footer">© Sanitation Management System</footer>
  </main>
}
