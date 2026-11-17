import DashboardShell from './DashboardShell.jsx'

const CUSTOMER_NAVIGATION = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: 'dashboard' },
  { label: 'Request a Service', path: '/customer/request-service', icon: 'service' },
  { label: 'My Requests', path: '/customer/requests', icon: 'requests' },
  { label: 'Payments', path: '/customer/payments', icon: 'payments' },
  { label: 'Notifications', path: '/customer/notifications', icon: 'notifications' },
  { label: 'My Profile', path: '/customer/profile', icon: 'profile' },
  { label: 'Settings', path: '/customer/settings', icon: 'settings' },
]

const REQUEST_STATUSES = ['PENDING', 'DECLINED', 'QUOTED', 'CUSTOMER_ACCEPTED', 'CUSTOMER_REJECTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="dash-page-heading">
    <div><p className="dash-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="dash-page-description">{description}</p></div>
    {action && <div className="dash-heading-action">{action}</div>}
  </div>
}

function MetricCard({ label, note, icon }) {
  return <article className="dash-metric-card">
    <div className="dash-metric-top"><span>{label}</span><span className="dash-metric-icon" aria-hidden="true">{icon}</span></div>
    <div className="dash-metric-value">—</div>
    <p>{note}</p>
  </article>
}

function EmptyState({ icon = '○', title, description, action }) {
  return <div className="dash-empty-state">
    <span className="dash-empty-icon" aria-hidden="true">{icon}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    {action}
  </div>
}

function Overview({ user, onNavigate }) {
  return <>
    <PageHeading eyebrow="Customer workspace" title={`Welcome back${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}`} description="Your sanitation services and account information, all in one place." />
    <section className="dash-account-strip" aria-label="Account information">
      <span className="dash-account-icon" aria-hidden="true">✓</span>
      <div><strong>Customer account</strong><p>{user?.email || 'Email not available'}{user?.phone ? ` · ${user.phone}` : ''}</p></div>
      {user?.accountStatus && <span className={`dash-status-pill status-${String(user.accountStatus).toLowerCase()}`}>{user.accountStatus.replaceAll('_', ' ')}</span>}
    </section>

    <section className="dash-section" aria-labelledby="overview-title">
      <div className="dash-section-heading"><div><h2 id="overview-title">Overview</h2><p>Service activity will appear here once requests are available.</p></div></div>
      <div className="dash-metric-grid">
        <MetricCard label="Total service requests" note="Request tracking is not available yet" icon="↗" />
        <MetricCard label="Pending requests" note="No request data available" icon="◷" />
        <MetricCard label="Active services" note="No service data available" icon="◎" />
        <MetricCard label="Completed services" note="No service data available" icon="✓" />
      </div>
    </section>

    <section className="dash-request-promo">
      <div className="dash-promo-copy"><span className="dash-promo-kicker">SANITATION SERVICES</span><h2>Need help with waste collection?</h2><p>When service requests become available, you’ll be able to find a provider and submit your requirements here.</p><button className="dash-primary-button" type="button" onClick={() => onNavigate('/customer/request-service')}>Explore services <span aria-hidden="true">→</span></button></div>
      <div className="dash-promo-mark" aria-hidden="true"><img src="/green-garbage-truck-logo.png" alt="" /></div>
    </section>

    <section className="dash-section">
      <div className="dash-section-heading"><div><h2>Recent requests</h2><p>Updates from your sanitation service requests.</p></div><button className="dash-text-button" type="button" onClick={() => onNavigate('/customer/requests')}>View requests <span aria-hidden="true">→</span></button></div>
      <EmptyState title="No requests yet" description="Your service requests and their latest updates will appear here." action={<button className="dash-secondary-button" type="button" onClick={() => onNavigate('/customer/request-service')}>Request a service</button>} />
    </section>
  </>
}

function RequestService({ onNavigate }) {
  return <>
    <PageHeading eyebrow="Services" title="Request a service" description="A simple place to begin arranging sanitation support for your home or business." />
    <section className="dash-workflow-panel">
      <div className="dash-workflow-steps">
        {['Choose a service', 'Select a provider', 'Share the location', 'Set a preferred date'].map((step, index) => <div className="dash-workflow-step" key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></div>)}
      </div>
      <EmptyState icon="＋" title="Service requests are not available yet" description="Once request services are connected, you’ll be able to compare providers, add details and submit your preferred date here." action={<span className="dash-coming-soon">Service request feature coming soon</span>} />
    </section>
    <button className="dash-back-link" type="button" onClick={() => onNavigate('/customer/dashboard')}>← Back to dashboard</button>
  </>
}

function Requests({ onNavigate }) {
  return <>
    <PageHeading eyebrow="Your activity" title="My requests" description="Follow each request from submission through completion." action={<button className="dash-primary-button" type="button" onClick={() => onNavigate('/customer/request-service')}>Request a service <span aria-hidden="true">→</span></button>} />
    <div className="dash-filter-row" aria-label="Request statuses">
      <button className="selected" type="button">All requests</button>
      {REQUEST_STATUSES.map((status) => <span className="dash-filter-chip" key={status}>{status.replaceAll('_', ' ')}</span>)}
    </div>
    <section className="dash-data-panel"><EmptyState title="No service requests to show" description="Submitted requests and their status history will appear here. No sample requests are being shown." /></section>
  </>
}

function Payments() {
  return <>
    <PageHeading eyebrow="Billing" title="Payments" description="Keep track of payments, receipts and transaction history." />
    <div className="dash-summary-grid">
      {['Pending payments', 'Successful payments', 'Failed payments'].map((item) => <div className="dash-summary-card" key={item}><span>{item}</span><strong>—</strong><small>Payment information not available yet</small></div>)}
    </div>
    <section className="dash-data-panel"><EmptyState icon="₵" title="No payment history yet" description="Payment records and receipts will appear here when payment services are available." /></section>
  </>
}

function Notifications() {
  return <>
    <PageHeading eyebrow="Updates" title="Notifications" description="Important updates about requests, quotations and service visits." />
    <section className="dash-data-panel"><EmptyState icon="♧" title="You’re all caught up" description="Updates from sanitation providers and payment confirmations will appear here." /></section>
  </>
}

function Profile({ user }) {
  return <>
    <PageHeading eyebrow="Account" title="My profile" description="The contact details associated with your customer account." />
    <section className="dash-profile-card">
      <span className="dash-avatar dash-avatar-large">{(user?.fullName || user?.email || 'C').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
      <div><p className="dash-eyebrow">CUSTOMER</p><h2>{user?.fullName || 'Name not available'}</h2><p>{user?.email || 'Email not available'}</p>{user?.phone && <p>{user.phone}</p>}</div>
      <div className="dash-profile-meta"><span>Account status</span><strong>{user?.accountStatus?.replaceAll('_', ' ') || 'Not provided'}</strong></div>
    </section>
  </>
}

function Settings() {
  return <>
    <PageHeading eyebrow="Preferences" title="Settings" description="Manage your account preferences." />
    <section className="dash-data-panel"><EmptyState icon="⚙" title="Settings are not available yet" description="Notification and account preferences will be available here in a future update." /></section>
  </>
}

export default function CustomerDashboard({ user, currentPath, onNavigate, onLogout }) {
  let page
  switch (currentPath) {
    case '/customer/request-service': page = <RequestService onNavigate={onNavigate} />; break
    case '/customer/requests': page = <Requests onNavigate={onNavigate} />; break
    case '/customer/payments': page = <Payments />; break
    case '/customer/notifications': page = <Notifications />; break
    case '/customer/profile': page = <Profile user={user} />; break
    case '/customer/settings': page = <Settings />; break
    default: page = <Overview user={user} onNavigate={onNavigate} />
  }

  return <DashboardShell user={user} roleLabel="Customer" navigation={CUSTOMER_NAVIGATION} currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>{page}</DashboardShell>
}
