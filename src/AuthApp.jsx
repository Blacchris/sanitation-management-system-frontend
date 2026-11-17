import { useEffect, useState } from 'react'
import { login, registerCustomer, registerOrganization, verifyOtp } from './api/auth.js'
import { useAuth } from './state/AuthContext.jsx'

const CUSTOMER_FIELDS = [
  ['fullName', 'Full name', 'text', 'Ama Mensah'],
  ['email', 'Email address', 'email', 'you@example.com'],
  ['phone', 'Phone number', 'tel', '+233 20 123 4567'],
]

const ORGANIZATION_FIELDS = [
  ['organizationName', 'Organization name', 'text', 'Clean Ghana Services'],
  ['registrationNumber', 'Registration number', 'text', 'REG-123456'],
]

const ORGANIZATION_AREAS = [
  ['description', 'About the organization', 'A short introduction to your organization'],
  ['serviceDescription', 'Services offered', 'Describe the sanitation services you provide'],
  ['businessAddress', 'Business address', 'Street, city, region'],
]

function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete, error, required = true }) {
  const [visible, setVisible] = useState(false)
  const inputType = type === 'password' && visible ? 'text' : type
  return <div className="field">
    <label htmlFor={id}>{label}{!required && <span className="optional"> · Optional</span>}</label>
    <div className={`input-wrap ${error ? 'has-error' : ''}`}>
      <input id={id} name={id} type={inputType} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} required={required} />
      {type === 'password' && <button className="reveal-button" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button>}
    </div>
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
  </div>
}

function TextArea({ id, label, value, onChange, placeholder, error }) {
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <textarea id={id} name={id} value={value} onChange={onChange} placeholder={placeholder} rows={3} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} required />
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

function initialRegistration() {
  return { fullName: '', email: '', phone: '', password: '', organizationName: '', registrationNumber: '', description: '', serviceDescription: '', contactEmail: '', businessAddress: '', otpChannel: 'EMAIL' }
}

function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }

function responseError(error, isLogin = false) {
  if (error.status === 401 && isLogin) return 'The email or password is incorrect.'
  if (error.status === 500 || !error.status) return error.message || 'We couldn’t reach the service. Check your connection and try again.'
  return error.message || 'Please review your details and try again.'
}

export default function AuthApp() {
  const { auth, authenticate, signOut } = useAuth()
  const [screen, setScreen] = useState('register')
  const [kind, setKind] = useState('customer')
  const [registration, setRegistration] = useState(initialRegistration)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [pending, setPending] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [apiError, setApiError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (screen !== 'verify' || secondsLeft <= 0) return undefined
    const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [screen, secondsLeft])

  const updateRegistration = (event) => {
    const { name, value } = event.target
    setRegistration((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setApiError('')
  }

  function validateRegistration() {
    const errors = {}
    const required = ['fullName', 'email', 'phone', 'password']
    if (kind === 'organization') required.push('organizationName', 'registrationNumber', 'description', 'serviceDescription', 'contactEmail', 'businessAddress')
    for (const field of required) if (!registration[field].trim()) errors[field] = 'This field is required.'
    if (registration.email && !validateEmail(registration.email)) errors.email = 'Enter a valid email address.'
    if (kind === 'organization' && registration.contactEmail && !validateEmail(registration.contactEmail)) errors.contactEmail = 'Enter a valid email address.'
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
      : { fullName: registration.fullName.trim(), email: registration.email.trim(), phone: registration.phone.trim(), password: registration.password, organizationName: registration.organizationName.trim(), registrationNumber: registration.registrationNumber.trim(), description: registration.description.trim(), serviceDescription: registration.serviceDescription.trim(), contactEmail: registration.contactEmail.trim(), businessAddress: registration.businessAddress.trim(), otpChannel: registration.otpChannel }
    try {
      const result = kind === 'customer' ? await registerCustomer(payload) : await registerOrganization(payload)
      setPending({ ...result, kind })
      setSecondsLeft(Math.max(0, Number(result.otpExpiresInSeconds) || 0))
      setRegistration((current) => ({ ...current, password: '' }))
      setOtp(''); setScreen('verify')
    } catch (error) {
      setApiError(responseError(error))
      setFieldErrors(error.fieldErrors || {})
    } finally { setBusy(false) }
  }

  async function submitOtp(event) {
    event.preventDefault()
    if (secondsLeft <= 0) { setApiError('This verification code has expired. Start registration again to receive a new code.'); return }
    if (!/^\d{6}$/.test(otp)) { setFieldErrors({ otp: 'Enter the six-digit verification code.' }); return }
    setBusy(true); setApiError(''); setFieldErrors({})
    try {
      const result = await verifyOtp({ email: pending.email, otp })
      authenticate(result)
      setScreen('complete')
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
      setScreen('complete')
    } catch (error) {
      setApiError(responseError(error, true))
      setFieldErrors(error.fieldErrors || {})
    } finally { setBusy(false) }
  }

  function backToRegistration() {
    setScreen('register'); setPending(null); setOtp(''); setApiError(''); setFieldErrors({})
    setNotice('Your registration details are still here. You can review them and start again.')
  }

  function toLogin() { setScreen('login'); setApiError(''); setFieldErrors({}); setNotice('') }
  function toRegister() { setScreen('register'); setApiError(''); setFieldErrors({}); setNotice('') }

  const role = auth?.user?.role
  const orgStatus = auth?.organization?.verificationStatus
  const isPendingOrg = role === 'ORGANIZATION' && orgStatus === 'PENDING'

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
          {auth || screen === 'complete' ? <>
            <div className="success-symbol" aria-hidden="true">✓</div>
            <p className="section-kicker">{isPendingOrg ? 'Registration received' : 'You’re signed in'}</p>
            <h2>{isPendingOrg ? 'Your organization is in review.' : `Welcome${auth?.user?.fullName ? `, ${auth.user.fullName.split(' ')[0]}` : ' back'}.`}</h2>
            <p className="form-subtitle">{isPendingOrg ? 'Your account is verified. An administrator needs to approve your organization before it can accept service requests.' : role === 'ORGANIZATION' ? 'Your organization account is verified and ready for the next step.' : role === 'ADMIN' ? 'You’re signed in with administrator access.' : 'Your account is ready to use.'}</p>
            {isPendingOrg && <div className="pending-callout"><span className="pending-dot"/><span><strong>Pending administrator approval</strong><small>You can sign in again any time to check your account.</small></span></div>}
            <div className="signed-in-detail"><span>Signed in as</span><strong>{auth?.user?.email}</strong><small>{role || 'Account'}</small></div>
            <button className="secondary-button full-button" type="button" onClick={() => { signOut(); setScreen('login'); setApiError('') }}>Sign out</button>
          </> : screen === 'verify' && pending ? <>
            <button className="back-link" type="button" onClick={backToRegistration}>← Back to registration</button>
            <p className="section-kicker">One last step</p>
            <h2>Verify your account</h2>
            <p className="form-subtitle">{pending.message} We sent it by <strong>{pending.channel}</strong> to <strong>{pending.sentTo}</strong>. Enter the code below to finish setting up your account.</p>
            {notice && <p className="notice-banner">{notice}</p>}
            <ErrorBanner>{apiError}</ErrorBanner>
            {secondsLeft <= 0 && <p className="expired-note" role="status">This code has expired. Return to registration to start again.</p>}
            <form onSubmit={submitOtp} noValidate>
              <div className="field otp-field">
                <label htmlFor="otp">Six-digit verification code</label>
                <input id="otp" className="otp-input" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors({}); setApiError('') }} onPaste={(event) => { const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (text) { event.preventDefault(); setOtp(text); setFieldErrors({}); setApiError('') } }} aria-invalid={Boolean(fieldErrors.otp)} aria-describedby={fieldErrors.otp ? 'otp-error' : 'otp-help'} placeholder="000000" required />
                {fieldErrors.otp && <p className="field-error" id="otp-error">{fieldErrors.otp}</p>}
                <p className="field-hint" id="otp-help">{secondsLeft > 0 ? <>Code expires in <strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</strong></> : 'The verification window has ended.'}</p>
              </div>
              <button className="primary-button full-button" type="submit" disabled={busy || secondsLeft <= 0}>{busy ? <><span className="spinner"/> Verifying…</> : 'Verify account'}</button>
            </form>
            <p className="form-footnote">Didn’t get a code? Check your spam folder or return to registration to try again.</p>
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
              <div className="form-section">
                {kind === 'organization' && <p className="form-section-title">Your account</p>}
                {CUSTOMER_FIELDS.map(([id, label, type, placeholder]) => <Field key={id} id={id} label={label} type={type} value={registration[id]} onChange={updateRegistration} placeholder={placeholder} autoComplete={id === 'fullName' ? 'name' : id === 'email' ? 'email' : 'tel'} error={fieldErrors[id]} />)}
                <Field id="password" label="Password" type="password" value={registration.password} onChange={updateRegistration} placeholder="Choose a password" autoComplete="new-password" error={fieldErrors.password} />
              </div>
              {kind === 'organization' && <div className="form-section organization-section">
                <p className="form-section-title">Organization details</p>
                {ORGANIZATION_FIELDS.map(([id, label, type, placeholder]) => <Field key={id} id={id} label={label} type={type} value={registration[id]} onChange={updateRegistration} placeholder={placeholder} error={fieldErrors[id]} />)}
                {ORGANIZATION_AREAS.slice(0, 2).map(([id, label, placeholder]) => <TextArea key={id} id={id} label={label} value={registration[id]} onChange={updateRegistration} placeholder={placeholder} error={fieldErrors[id]} />)}
                <Field id="contactEmail" label="Organization contact email" type="email" value={registration.contactEmail} onChange={updateRegistration} placeholder="contact@organization.com" autoComplete="email" error={fieldErrors.contactEmail} />
                <TextArea id="businessAddress" label="Business address" value={registration.businessAddress} onChange={updateRegistration} placeholder="Street, city, region" error={fieldErrors.businessAddress} />
              </div>}
              <ChannelSelect value={registration.otpChannel} onChange={updateRegistration} />
              {fieldErrors.otpChannel && <p className="field-error">{fieldErrors.otpChannel}</p>}
              <p className="field-hint channel-hint">We’ll send a one-time code to your selected contact method. Your account is only created after you verify it.</p>
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
