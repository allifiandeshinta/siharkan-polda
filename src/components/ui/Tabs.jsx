export function Tabs({ tabs, activeTab, onTabChange, className = '' }) {
  return (
    <div className={`tabs ${className}`.trim()}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function TabPanel({ children, isActive, className = '' }) {
  if (!isActive) return null
  return (
    <div className={`tab-panel active ${className}`.trim()}>
      {children}
    </div>
  )
}
