
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    const success = login(username.trim());
    if (!success) {
      setError('Invalid username. Please contact your manager for access.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Saucer Burger
          </CardTitle>
          <p className="text-gray-600">Restaurant Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Enter your username"
                className="mt-1"
                autoFocus
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>Allowed users: admin, manager, worker1, worker2, chef, cashier</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
