// src/pages/UpdatePasswordPage.tsx
import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const UpdatePasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Supabase automatically handles the user session from the URL token
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Your password has been updated successfully!');
    }
    setLoading(false);
  };
  
  // If the password has been updated, show the success message
  if (successMessage) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-green-500">Success!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{successMessage}</p>
            <p className="mt-4">
              <Link to="/login" className="text-amber-400 hover:underline">
                Return to the Sign In page
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-400">Create a New Password</CardTitle>
          <CardDescription className="text-gray-300">
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">New Password</label>
              <Input 
                id="password" 
                type="password" 
                placeholder="********" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6}
                className="mt-1 bg-gray-700 border-gray-600 text-white" 
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm New Password</label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="********" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                minLength={6}
                className="mt-1 bg-gray-700 border-gray-600 text-white" 
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;