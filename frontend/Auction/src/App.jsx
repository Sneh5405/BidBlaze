import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuctionDetail from './pages/AuctionDetail'
import CreateAuction from './pages/CreateAuction'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import ErrorBoundary from './components/ErrorBoundary'

// protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to='/login' />
}

function App() {
  return (
    <BrowserRouter>
    <ErrorBoundary>
      <Navbar />
      <main className='pt-20 max-w-7xl mx-auto px-4'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/auction/:id' element={<AuctionDetail />} />
          <Route path='/create-auction' element={
            <ProtectedRoute><CreateAuction /></ProtectedRoute>
          } />
          <Route path='/dashboard' element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/messages' element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />
          <Route path='/messages/:id' element={
            <ProtectedRoute><Chat /></ProtectedRoute>
          } />
        </Routes>
      </main>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App