import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center" style={{ padding: 40 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Terjadi Kesalahan</h1>
            <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>
              {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga.'}
            </p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
