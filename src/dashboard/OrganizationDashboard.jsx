import DashboardShell from './DashboardShell.jsx'

const ORGANIZATION_NAVIGATION = [
  { label: 'Dashboard', path: '/organization/dashboard', icon: 'dashboard' },
  { label: 'Incoming Requests', path: '/organization/requests', icon: 'requests' },
  { label: 'Quotations', path: '/organization/quotations', icon: 'quotes' },
  { label: 'Service Management', path: '/organization/services', icon: 'service' },
  { label: 'Schedule', path: '/organization/schedule', icon: 'schedule' },
  { label: 'Earnings & Payouts', path: '/organization/earnings', icon: 'earnings' },
  { label: 'Notifications', path: '/organization/notifications', icon: 'notifications' },
  { label: 'Organization Profile', path: '/organization/profile', icon: 'profile' },
  { label: 'Settings', path: '/organization/settings', icon: 'settings' },
]

const SERVICE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
const QUOTATION_STATES = ['Pending customer response', 'Accepted', 'Rejected', 'Revised']

function Heading({ eyebrow, title, description }) {
  return <div className="dash-page-heading"><div><p className="dash-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="dash-page-description">{description}</p></div></div>
}

function EmptyState({ icon = '○', title, description }) {
  return <div className="dash-empty-state"><span className="dash-empty-icon" aria-hidden="true">{icon}</span><h3>{title}</h3><p>{description}</p></div>
}

function MetricCard({ title, detail, icon }) {
  return <article className="dash-metric-card"><div className="dash-metric-top"><span>{title}</span><span className="dash-metric-icon" aria-hidden="true">{icon}</span></div><strong className="dash-metric-value">—</strong><p>{detail}</p></article>
}

function Overview({ organization }) {
  return <>
    <Heading eyebrow="Organization workspace" title={`Welcome${organization?.organizationName ? `, ${organization.organizationName}` : ' to your workspace'}`} description="Manage service requests and your organization’s work through SaniLink." />
    <section className="dash-account-strip"><span className="dash-account-icon" aria-hidden="true">✓</span><div><strong>{organization?.organizationName || 'Organization profile'}</strong><p>{organization?.contactEmail || 'Organization details are not included in the current login response.'}</p></div>{organization?.verificationStatus && <span className={`dash-status-pill status-${String(organization.verificationStatus).toLowerCase()}`}>{organization.verificationStatus.replaceAll('_', ' ')}</span>}</section>
    <section className="dash-section"><div className="dash-section-heading"><div><h2>Business overview</h2><p>Request and earnings data will appear when the related services are available.</p></div></div><div className="dash-metric-grid">
      <MetricCard title="New service requests" detail="Request data not available yet" icon="↗" />
      <MetricCard title="Pending quotations" detail="Quotation data not available yet" icon="◷" />
      <MetricCard title="Active jobs" detail="Service data not available yet" icon="◎" />
      <MetricCard title="Total earnings" detail="Payment data not available yet" icon="₵" />
    </div></section>
    <section className="dash-section"><div className="dash-section-heading"><div><h2>Incoming requests</h2><p>Review work submitted by customers.</p></div></div><EmptyState title="No incoming requests" description="Customer requests will be listed here once the request service is available." /></section>
  </>
}

function IncomingRequests() {
  return <><Heading eyebrow="Customer work" title="Incoming requests" description="Review service needs, locations and preferred dates before deciding whether a job fits your team."/><section className="dash-data-panel"><div className="dash-request-fields">{['Customer name', 'Service type and description', 'Service location', 'Preferred service date', 'Waste-dump images', 'Submission date'].map((field) => <span key={field}>{field}</span>)}</div><EmptyState title="No service requests yet" description="New customer requests and their uploaded details will appear here when the request API is available."/></section></>
}

function Quotations() {
  return <><Heading eyebrow="Pricing" title="Quotations" description="Prepare and track quotes for jobs that your organization can undertake."/><div className="dash-filter-row">{QUOTATION_STATES.map((state) => <span className="dash-filter-chip" key={state}>{state}</span>)}</div><section className="dash-data-panel"><EmptyState title="No quotations to show" description="Quotation submission and customer approval are not available yet. Revised charges should be agreed with the customer before additional work begins."/></section></>
}

function ServiceManagement() {
  return <><Heading eyebrow="Operations" title="Service management" description="Track work from scheduling through completion."/><div className="dash-filter-row">{SERVICE_STATUSES.map((status) => <span className="dash-filter-chip" key={status}>{status.replaceAll('_', ' ')}</span>)}</div><section className="dash-data-panel"><EmptyState title="No active jobs" description="Scheduled, in-progress and completed work will appear here once service management is connected."/></section></>
}

function Schedule() {
  return <><Heading eyebrow="Calendar" title="Schedule" description="See upcoming visits and plan your team’s service work."/><section className="dash-data-panel"><EmptyState icon="▦" title="Your schedule is clear" description="There are no scheduled jobs to display. Scheduling will be available when service requests are supported."/></section></>
}

function Earnings() {
  return <><Heading eyebrow="Business finances" title="Earnings & payouts" description="Review customer payments, platform deductions and settlement history."/><div className="dash-summary-grid">{['Customer payments', 'Platform commission', 'Organization earnings', 'Pending settlements'].map((label) => <div className="dash-summary-card" key={label}><span>{label}</span><strong>—</strong><small>Financial data not available yet</small></div>)}</div><section className="dash-data-panel"><EmptyState icon="₵" title="No payout history yet" description="Payout and transaction records will appear here when payment services are available."/></section></>
}

function Notifications() {
  return <><Heading eyebrow="Updates" title="Notifications" description="Keep up with new requests, quotations, schedules and completed jobs."/><section className="dash-data-panel"><EmptyState icon="♧" title="No notifications yet" description="Request and payment updates will appear here when notifications are supported."/></section></>
}

function Profile({ organization }) {
  return <><Heading eyebrow="Business account" title="Organization profile" description="The public information customers will use to understand your services."/><section className="dash-profile-card"><span className="dash-avatar dash-avatar-large">{(organization?.organizationName || 'Organization').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><div><p className="dash-eyebrow">ORGANIZATION</p><h2>{organization?.organizationName || 'Organization details unavailable'}</h2><p>{organization?.contactEmail || 'Contact email not included in the current login response.'}</p>{organization?.contactPhone && <p>{organization.contactPhone}</p>}</div><div className="dash-profile-meta"><span>Verification status</span><strong>{organization?.verificationStatus?.replaceAll('_', ' ') || 'Not provided'}</strong></div></section></>
}

function Settings() {
  return <><Heading eyebrow="Preferences" title="Settings" description="Manage your organization workspace preferences."/><section className="dash-data-panel"><EmptyState icon="⚙" title="Settings are not available yet" description="Organization preferences will appear here in a future update."/></section></>
}

export default function OrganizationDashboard({ user, organization, currentPath, onNavigate, onLogout }) {
  let page
  switch (currentPath) {
    case '/organization/requests': page = <IncomingRequests/>; break
    case '/organization/quotations': page = <Quotations/>; break
    case '/organization/services': page = <ServiceManagement/>; break
    case '/organization/schedule': page = <Schedule/>; break
    case '/organization/earnings': page = <Earnings/>; break
    case '/organization/notifications': page = <Notifications/>; break
    case '/organization/profile': page = <Profile organization={organization}/>; break
    case '/organization/settings': page = <Settings/>; break
    default: page = <Overview organization={organization}/> 
  }
  return <DashboardShell user={user} roleLabel="Organization" navigation={ORGANIZATION_NAVIGATION} currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>{page}</DashboardShell>
}
