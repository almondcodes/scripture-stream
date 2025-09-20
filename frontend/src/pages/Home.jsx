import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Monitor, 
  Users, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  Play,
  Star
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  const features = [
    {
      icon: BookOpen,
      title: 'Multiple Bible Versions',
      description: 'Access KJV, NIV, ESV, and more translations with real-time verse lookup.'
    },
    {
      icon: Monitor,
      title: 'OBS Integration',
      description: 'Seamlessly send verses to OBS Studio with advanced WebSocket controls.'
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Work together with your team using live updates and shared playlists.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized for performance with instant verse delivery and smooth animations.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy controls.'
    },
    {
      icon: Globe,
      title: 'Cross-Platform',
      description: 'Works on desktop, tablet, and mobile devices with responsive design.'
    }
  ]

  const stats = [
    { label: 'Active Users', value: '1,000+' },
    { label: 'Verses Streamed', value: '50,000+' },
    { label: 'Playlists Created', value: '5,000+' },
    { label: 'Uptime', value: '99.9%' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ScriptureStream</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary btn-md"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Stream God's Word to Your Audience
            </h1>
            <p className="mt-6 text-xl leading-8 text-primary-100 max-w-3xl mx-auto">
              The ultimate Bible verse streaming platform for OBS Studio. 
              Create playlists, collaborate in real-time, and share Scripture 
              with beautiful, customizable templates.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Streaming
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="text-sm font-semibold leading-6 text-white hover:text-primary-100"
                  >
                    Sign in <ArrowRight className="inline h-4 w-4 ml-1" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to stream Scripture
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features designed for content creators, churches, and Bible study groups.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start streaming Scripture?
            </h2>
            <p className="mt-4 text-xl text-primary-100">
              Join thousands of content creators sharing God's Word with their audiences.
            </p>
            <div className="mt-8">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50"
                >
                  Start Free Trial
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-white">ScriptureStream</span>
              </div>
              <p className="mt-4 text-gray-400">
                The ultimate Bible verse streaming platform for OBS Studio. 
                Share God's Word with beautiful, customizable templates.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Product</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Support</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-center">
              © 2024 ScriptureStream. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
