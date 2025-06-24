import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import backgroundImage from '../../assets/erplogin.jpg'
import logo from '../../assets/pgl_logo.png'

const Login = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login({ email, password })
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay with #1E5269 filter */}
      <div className="absolute inset-0" style={{ backgroundColor: '#000000', opacity: 0.8 }}></div>
      
      {/* Logo top right */}
      <div className="absolute top-8 right-20 z-20">
        <img src={logo} alt="PGL Logo" className="h-20 w-auto" />
      </div>
      
      <div className="relative z-10 flex items-center justify-center space-x-6 w-full max-w-4xl">
        {/*Login Card */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 w-80 shadow-lg border border-white/10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-6">Log in</h1>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-sm text-red-200 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Email field */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <span className="text-sm text-white/70">e-mail address</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-sm border-b border-white/30 pb-1 bg-transparent focus:outline-none focus:border-white/60 text-white placeholder-white/40"
                placeholder=""
              />
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <span className="text-sm text-white/70">password</span>
                </div>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border-b border-white/30 rounded-sm pb-1 bg-transparent focus:outline-none focus:border-white/60 text-white placeholder-white/40"
                placeholder=""
              />
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-full text-sm font-medium hover:bg-white/30 transition-colors disabled:opacity-70 border border-white/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Footer text */}
          <div className="text-center">
            <p className="text-xs text-white/50 mb-4">
              By logging into your account, you agree to our<br />
              Terms and acknowledge you've read our<br />
              Privacy Policy. 
            </p>
          </div>
        </div>

      

      </div>
    </div>
  )
}

export default Login