'use client'

import { useState, FormEvent } from 'react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Success! Check your inbox.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div
        data-testid="subscribe-success"
        className={cn(
          'rounded-lg border border-success/30 bg-success/10 p-6 text-center',
          compact && 'p-4'
        )}
      >
        <p className="font-medium text-success">{message}</p>
      </div>
    )
  }

  return (
    <form data-testid="subscribe-form" onSubmit={handleSubmit} className="space-y-4">
      <div
        className={cn(
          'flex gap-3',
          compact ? 'flex-col sm:flex-row' : 'flex-col'
        )}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={status === 'loading'}
          aria-label="Email address"
          className={cn(
            'flex-1 rounded-lg border border-border-1 bg-surface-1 px-4 py-3 text-text-1 placeholder:text-text-3',
            'focus:border-warm focus:outline-none focus:ring-1 focus:ring-warm',
            'disabled:opacity-50',
            compact && 'py-2'
          )}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'rounded-lg bg-warm px-6 py-3 font-medium text-bg-1 transition-colors',
            'hover:bg-warm/90 focus:outline-none focus:ring-2 focus:ring-warm focus:ring-offset-2 focus:ring-offset-bg-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            compact && 'px-4 py-2'
          )}
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>

      {status === 'error' && message && (
        <p className="text-sm text-error" role="alert">
          {message}
        </p>
      )}
    </form>
  )
}
