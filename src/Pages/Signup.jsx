import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthShell from '../components/AuthShell'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)
    if (error) return toast.error(error.message)

    if (data.session) {
      toast.success('Account created!')
      navigate('/')
    } else {
      toast.success('Check your email to confirm your account.')
      navigate('/login')
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start booking flights in seconds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>
        <button
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
