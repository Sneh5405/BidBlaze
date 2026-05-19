import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Error caught by boundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center px-4'>
          <div className='text-center max-w-md'>
            <div className='text-6xl mb-6'>⚠️</div>
            <h2 className='text-2xl font-bold text-white mb-3'>
              Something went wrong
            </h2>
            <p className='text-gray-400 mb-6'>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors'
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary