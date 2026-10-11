import React from 'react'

export default function Modal({ open, title, children, onClose, size = 'medium' }) {
  if (!open) return null

  const maxWidth = size === 'large' ? 800 : size === 'small' ? 400 : 560

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        padding: 20
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white', borderRadius: 12, width: '100%', maxWidth,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', padding: 8, cursor: 'pointer',
              color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
