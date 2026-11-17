import { useState } from 'react'

const NAV_ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  requests: <><path d="M8 4h8l3 3v13H5V4h3Z"/><path d="M8 11h8M8 15h6"/></>,
  service: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="6"/></>,
  payments: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
  notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
  profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.8-1.7 2.9-2.1-.5a8 8 0 0 1-1.5.9l-.4 2.1h-3.4l-.4-2.1a8 8 0 0 1-1.5-.9l-2.1.5-1.7-2.9 1.1-1.8a8 8 0 0 1 0-1.8l-1.1-1.8 1.7-2.9 2.1.5a8 8 0 0 1 1.5-.9l.4-2.1h3.4l.4 2.1a8 8 0 0 1 1.5.9l2.1-.5 1.7 2.9-1.1 1.8a8 8 0 0 1 0 1.7Z" transform="translate(-1 -1) scale(1.08)"/></>,
  quotes: <><path d="M7 4h10v4H7zM5 8h14v13H5z"/><path d="M8 12h8M8 16h6"/></>,
  schedule: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3"/></>,
  earnings: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
}

function NavIcon({ name }) {
  return <svg className="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{NAV_ICONS[name] || NAV_ICONS.service}</svg>
}

function initials(user) {
  const value = user?.fullName || user?.email || 'SaniLink'
  return value.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function DashboardShell({ user, roleLabel, navigation, currentPath, onNavigate, onLogout, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const activeItem = navigation.find((item) => item.path === currentPath) || navigation[0]

  const go = (path) => {
    setMobileNavOpen(false)
    setProfileMenuOpen(false)
    onNavigate(path)
  }

  return <div className="dashboard-app">
    {mobileNavOpen && <button className="dash-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`dash-sidebar ${mobileNavOpen ? 'open' : ''}`}>
      <a className="dash-brand" href="/customer/dashboard" onClick={(event) => { event.preventDefault(); go(navigation[0].path) }}>
        <img src="/green-garbage-truck-logo.png" alt="" />
        <span><strong><span>Sani</span>Link</strong><small>Cleaner living, connected</small></span>
      </a>
      <div className="dash-workspace-label">WORKSPACE</div>
      <nav className="dash-navigation" aria-label={`${roleLabel} navigation`}>
        {navigation.map((item) => <button key={item.path} className={`dash-nav-item ${activeItem.path === item.path ? 'active' : ''}`} type="button" onClick={() => go(item.path)} aria-current={activeItem.path === item.path ? 'page' : undefined}>
          <NavIcon name={item.icon}/><span>{item.label}</span>
        </button>)}
      </nav>
      <div className="dash-sidebar-bottom">
        <div className="dash-help-note"><span className="dash-help-mark">i</span><span><strong>Need a hand?</strong><small>Support options will be available here.</small></span></div>
        <button className="dash-logout" type="button" onClick={onLogout}><span aria-hidden="true">↗</span> Sign out</button>
      </div>
    </aside>

    <div className="dash-main">
      <header className="dash-topbar">
        <button className="dash-menu-toggle" type="button" aria-label="Open navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>☰</button>
        <div className="dash-breadcrumb"><span>{roleLabel} workspace</span><b>/</b><strong>{activeItem.label}</strong></div>
        <div className="dash-top-actions">
          <button className="dash-icon-button" type="button" aria-label="Notifications" onClick={() => go(navigation.find((item) => item.icon === 'notifications')?.path || navigation[0].path)}>
            <NavIcon name="notifications"/>
          </button>
          <div className="dash-profile-wrap">
            <button className="dash-profile-button" type="button" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)}>
              <span className="dash-avatar">{initials(user)}</span>
              <span className="dash-profile-name"><strong>{user?.fullName || user?.email || 'Account'}</strong><small>{roleLabel}</small></span>
              <span className="dash-chevron" aria-hidden="true">⌄</span>
            </button>
            {profileMenuOpen && <div className="dash-profile-menu">
              <button type="button" onClick={() => go(navigation.find((item) => item.icon === 'profile')?.path || navigation[0].path)}>View profile</button>
              <button type="button" onClick={onLogout}>Sign out</button>
            </div>}
          </div>
        </div>
      </header>
      <main className="dash-content" key={currentPath}>
        {children}
      </main>
      <footer className="dash-footer"><span>SaniLink</span><span>Connecting Communities to Cleaner Living.</span></footer>
    </div>
  </div>
}

export { NavIcon }
