// src/pages/VerifyPhonePage.tsx

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

// This helper function will find the real error message
const getErrorMessage = (error: any): string => {
  if (error.context && error.context.body) {
    try {
      // Try to parse the JSON error from the function
      const body = JSON.parse(error.context.body);
      return body.error || "An unknown error occurred.";
    } catch (e) {
      // Fallback if it's not JSON
      return error.message;
    }
  }
  return error.message;
}

const VerifyPhonePage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('+995')
  const [code, setCode] = useState('') 
  const [step, setStep] = useState(1) 
  const [requestId, setRequestId] = useState('') 
  const [isClaimStatusChecked, setIsClaimStatusChecked] = useState(false); // <--- THIS LINE WAS MISSING
  const navigate = useNavigate()
  const { toast } = useToast()

  // ADD THIS HOOK
  useEffect(() => {
    const checkClaimStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Check if this user already has a record in the phone verification table
            const { data: verified, error } = await supabase
                .from('verified_phones')
                .select('id') // We only need to check if the record exists
                .eq('user_id', user.id)
                .maybeSingle();

            if (verified) {
                // User has already claimed the bonus. Redirect them away.
                navigate('/account', { replace: true });
                return;
            }
        }
        // Only set the check flag to true if no redirect occurred
        setIsClaimStatusChecked(true);
    };

    checkClaimStatus();
}, [navigate]); // The dependency array ensures this runs once on load

  // Step 1: Call our 'send-verification-sms' Edge Function
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.functions.invoke(
        'send-verification-sms',
        { body: { phone } }
      )
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRequestId(data.request_id) 
      setStep(2) 
      toast({ title: 'Code Sent!', description: 'Check your phone for the verification code.' })

    } catch (err: any) {
      // Use the new error helper
      setError(getErrorMessage(err))
    }
    setLoading(false)
  }

  // Step 2: Call our 'verify-sms-and-grant-bonus' Edge Function
  const handleVerifyAndClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-sms-and-grant-bonus',
        { 
          body: { 
            phone: phone, 
            code: code,
            request_id: requestId
          } 
        }
      )

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // SUCCESS!
      toast({ title: 'Success!', description: data.message, className: "bg-green-600 text-white" })
      navigate('/account') 

    } catch (err: any) {
      // Use the new error helper
      const errorMessage = getErrorMessage(err);
      setError(errorMessage)
      
      if (errorMessage.includes("already been used")) {
         toast({ title: 'Bonus Already Claimed', description: errorMessage, variant: 'destructive' })
         navigate('/account')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-400">Claim Your 5 GEL Bonus</CardTitle>
          <CardDescription className="text-gray-300">
            {step === 1 
              ? "Verify your phone number to receive your 5 GEL wallet bonus." 
              : "Enter the verification code we sent to your phone."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Enter Phone Number */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone Number</label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+995 555 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
                {loading ? 'Sending...' : 'Send Code'}
              </Button>
            </form>
          )}

          {/* Step 2: Enter Verification Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndClaim} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300">Verification Code</label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter the code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)} 
                  required
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? 'Verifying...' : 'Verify & Claim Bonus'}
              </Button>
              <Button variant="link" onClick={() => { setStep(1); setError(''); }} className="text-gray-400">
                Use a different phone number
              </Button>
            </form>
          )}
          
          <div className="mt-4 text-center text-sm">
            <Link to="/account" className="text-gray-400 hover:text-amber-400 transition">
              I'll do this later
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyPhonePage