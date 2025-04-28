'use client'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Leaf, LogIn, Loader, AlertCircle, LogOut, User } from "lucide-react"
import { createUser, getUserByEmail } from "@/utils/db/actions"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const router = useRouter()

  // Check authentication state on component mount
  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    const storedName = localStorage.getItem('userName')
    
    if (email) {
      setIsAuthenticated(true)
      setUserEmail(email)
      if (storedName) setUserName(storedName)
      
      // Try to fetch user details from database if available
      getUserByEmail(email).then(user => {
        if (user) {
          setUserName(user.name || storedName || 'User')
        }
      }).catch(err => {
        console.error('Failed to fetch user details:', err)
        // Fallback to localstorage name if DB fails
        if (storedName) setUserName(storedName)
      })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    setIsAuthenticated(false)
    setUserEmail('')
    setUserName('')
    router.push('/')
  }

  // Return the main Header component for logged in users
  if (isAuthenticated) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-green-500 mr-2" />
              <span className="text-xl font-bold text-gray-800">Zero2Hero</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-500">Home</Link>
              <Link href="/map" className="text-gray-700 hover:text-green-500">Map</Link>
              <Link href="/rewards" className="text-gray-700 hover:text-green-500">Rewards</Link>
              <Link href="/profile" className="text-gray-700 hover:text-green-500">Profile</Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-1" />
                <span>{userName || userEmail}</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm"
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // The rest is your LoginPage component, only shown when not authenticated
  return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
}

// Separate LoginPage component
function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const router = useRouter()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setLoginError("Please enter your email address")
      return
    }
    
    setLoginError(null)
    setLoading(true)
    
    try {
      // First store in localStorage for local auth
      localStorage.setItem('userEmail', email)
      if (name) localStorage.setItem('userName', name)
      
      // Try database operations, but don't block auth if they fail
      let dbSuccess = false
      try {
        // Try to create or update user in the database
        const dbUser = await createUser(email, name || 'Anonymous User')
        if (dbUser) {
          console.log("User created/logged in:", dbUser)
          dbSuccess = true
        }
      } catch (dbError) {
        console.error("Database operation failed:", dbError)
        // We'll continue anyway since we have localStorage auth
      }
      
      // Always consider login successful even if DB fails
      console.log("Login successful, redirecting...")
      onLoginSuccess() // Update parent component state
      
      // If there was a DB error but we're proceeding, show a non-blocking message
      if (!dbSuccess) {
        console.warn("Using local authentication only")
      }
      
      router.push('/')
    } catch (error) {
      console.error("Unexpected error during login:", error)
      
      // If there's some other unexpected error
      if (error instanceof Error) {
        setLoginError(`Error: ${error.message}`)
      } else {
        setLoginError("An unexpected error occurred")
      }
      
      // Clean up localStorage if there was a critical error
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Leaf className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome To Wastelens</h1>
          <p className="mt-2 text-gray-600">Sign in to access the waste management platform</p>
        </div>
        
        <form onSubmit={login} className="mt-8 space-y-6">
          {loginError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-600">{loginError}</p>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Your Name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </>
            )}
          </Button>
          
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Blockchain Rewards</span>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                disabled
                className="w-full bg-gray-200 text-gray-500 cursor-not-allowed"
              >
                Web3 Rewards (Coming Soon)
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                Blockchain-based rewards system is currently under development and will be available soon.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}