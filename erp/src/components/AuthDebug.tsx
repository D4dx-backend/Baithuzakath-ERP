import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { beneficiaryApi } from "@/services/beneficiaryApi";

export default function AuthDebug() {
  const [authState, setAuthState] = useState({
    token: null as string | null,
    user: null as any,
    isAuthenticated: false
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = () => {
    const token = localStorage.getItem('beneficiary_token');
    const userStr = localStorage.getItem('beneficiary_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAuthenticated = beneficiaryApi.isAuthenticated();

    setAuthState({
      token,
      user,
      isAuthenticated
    });
  };

  const testAPI = async () => {
    try {
      console.log('🧪 Testing API call...');
      const response = await beneficiaryApi.getAvailableSchemes();
      console.log('✅ API call successful:', response);
      alert('API call successful! Check console for details.');
    } catch (error) {
      console.error('❌ API call failed:', error);
      alert(`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('beneficiary_token');
    localStorage.removeItem('beneficiary_user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_phone');
    checkAuthState();
  };

  return (
    <Card className="max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Authentication State:</h3>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            <div>Token exists: {authState.token ? '✅ Yes' : '❌ No'}</div>
            <div>Token preview: {authState.token ? authState.token.substring(0, 30) + '...' : 'None'}</div>
            <div>User exists: {authState.user ? '✅ Yes' : '❌ No'}</div>
            <div>User name: {authState.user?.name || 'None'}</div>
            <div>User phone: {authState.user?.phone || 'None'}</div>
            <div>Is authenticated: {authState.isAuthenticated ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Local Storage:</h3>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            <div>beneficiary_token: {localStorage.getItem('beneficiary_token') ? '✅ Exists' : '❌ Missing'}</div>
            <div>beneficiary_user: {localStorage.getItem('beneficiary_user') ? '✅ Exists' : '❌ Missing'}</div>
            <div>user_role: {localStorage.getItem('user_role') || 'None'}</div>
            <div>user_phone: {localStorage.getItem('user_phone') || 'None'}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={checkAuthState} variant="outline">
            Refresh State
          </Button>
          <Button onClick={testAPI}>
            Test API Call
          </Button>
          <Button onClick={clearAuth} variant="destructive">
            Clear Auth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}