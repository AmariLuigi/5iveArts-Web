'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase-browser'
import type { accounts, CredentialResponse } from 'google-one-tap'
import { useRouter } from 'next/navigation'

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

  const initializeGoogleOneTap = async () => {
    console.log('Initializing Google One Tap')
    const [nonce, hashedNonce] = await generateNonce()
    
    // check if there's already an existing session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting user', error)
    }

    if (user) {
      // already logged in
      return
    }

    /* global google */
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: async (response: CredentialResponse) => {
          try {
            // send id token returned in response.credential to supabase
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            })
            if (error) throw error
            console.log('Session data: ', data)
            console.log('Successfully logged in with Google One Tap')
            
            // force refresh to update auth state across components
            router.refresh()
          } catch (error) {
            console.error('Error logging in with Google One Tap', error)
          }
        },
        nonce: hashedNonce,
        // with chrome's removal of third-party cookies, we need to use FedCM instead
        use_fedcm_for_prompt: true,
      })
      google.accounts.id.prompt() // Display the One Tap UI
    }
  }

  return <Script onReady={() => { initializeGoogleOneTap(); }} src="https://accounts.google.com/gsi/client" />
}

export default OneTapComponent
