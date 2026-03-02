import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useAuthStore } from '@/store/auth'

export function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const loginFn = useAuthStore(s => s.login)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const ok = await loginFn(password)
    if (!ok) {
      setError('Incorrect password.')
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <form className="lc" onSubmit={handleSubmit}>
        <div>
          <div className="lc-eye">Laniameda Studio</div>
          <div className="lc-title" style={{ marginTop: 5 }}>
            Agent <span>Hub</span>
          </div>
        </div>
        <div className="lc-div" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            ref={inputRef}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="btn-p" type="submit" disabled={submitting}>
            {submitting ? 'Entering...' : '\u2192\u00A0 Enter Hub'}
          </button>
        </div>
        <div className="le">{error}</div>
      </form>
    </div>
  )
}
