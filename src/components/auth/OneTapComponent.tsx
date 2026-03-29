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

interface OneTapProps {
  lang: string;
  next?: string;
}

const OneTapComponent = ({ lang, next = 'account' }: OneTapProps) => {
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
            const target = next.startsWith('/') ? next : `/${next}`;
            router.push(`/${lang}${target}`);
            router.refresh();
          } catch (error) {
            console.error('[auth/google] Synchronous verification failed:', error)
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        // @ts-ignore - Google FedCM migration requirement missing in local types
        use_fedcm_for_button: true,
      })
      
      // 1. One Tap Prompt (Silent/Background)
      // Migration: Removed status callbacks as they are deprecated in FedCM.
      google.accounts.id.prompt();


      // 2. Manual Button Branding (Overlay)
      // This ensures that when the user clicks our "Continue with Google" button,
      // they are actually clicking the official branded Google button (invisible overlay),
      // which triggers an on-domain popup branded as "5ive Arts".
      const overlay = document.getElementById('google-auth-overlay');
      if (overlay) {
        google.accounts.id.renderButton(overlay, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'outline',
            size: 'large',
            width: overlay.offsetWidth || 400
        });
      }
    }
  }

  useEffect(() => {
    // Background refresh check
    const check = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) router.refresh();
    };
    check();
  }, []);

  return <Script onReady={() => { initializeGoogleAuth(); }} src="https://accounts.google.com/gsi/client" />
}

export default OneTapComponent;
