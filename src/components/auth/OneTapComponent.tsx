'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase-browser'
import type { accounts, CredentialResponse } from 'google-one-tap'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

declare const google: { accounts: accounts }

// generate nonce to use for google id token sign-in
const generateNonce = async (): Promise<string[]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return [nonce, hashedNonce]
}

const OneTapComponent = () => {
  const supabase = createClient()
  const router = useRouter()

  const initializeGoogleAuth = async (manual = false) => {
    console.log('Initializing Google Authentication Protocol', manual ? '(Manual)' : '(Background)')
    const [nonce, hashedNonce] = await generateNonce()
    
    // Check session safety
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !manual) return;

    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: async (response: CredentialResponse) => {
          try {
            console.log('[auth/google] Validating Identity Token on-domain...')
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            })
            if (error) throw error
            console.log('[auth/google] Identity Verified. Synchronizing Session.')
            router.refresh()
          } catch (error) {
            console.error('[auth/google] Synchronous verification failed:', error)
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
      })
      
      // If manual, we can't easily force the One Tap if it was closed, 
      // but we can at least try to prompt or render the Google Button.
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('[auth/google] Display suppressed:', notification.getNotDisplayedReason())
        }
      })
    }
  }

  useEffect(() => {
    // Expose manual trigger to the window for TerminalForm use
    (window as any).triggerGoogleAuth = () => initializeGoogleAuth(true);
  }, []);

  return <Script onReady={() => { initializeGoogleAuth(); }} src="https://accounts.google.com/gsi/client" />
}

export default OneTapComponent;
