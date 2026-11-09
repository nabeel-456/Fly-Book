import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plane, LogOut, UserCircle, Ticket, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/Authcontext'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) return toast.error(error.message)
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-sky-600">
          <span className="rounded-xl bg-sky-600 p-1.5 text-white">
            <Plane size={18} className="-rotate-45" />
          </span>
          FlyBook
        </Link>

        <div className="flex items-center gap-2 text-sm font-medium">
          {user ? (
            <>
              <Link
                to="/bookings"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                <Ticket size={16} /> My Bookings
              </Link>
              <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 md:flex">
                <UserCircle size={16} /> {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-700"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                <LogIn size={16} /> Login
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-white shadow-sm transition hover:bg-sky-700"
              >
                <UserPlus size={16} /> Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}