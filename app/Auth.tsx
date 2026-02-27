"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fef3c7_28%,_#f8fafc_60%,_#fff_100%)]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-amber-200/70 flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-bold text-zinc-900 text-2xl">
              A
            </div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">
              Archy
            </h1>
          </div>
          <p className="text-zinc-600">
            {isSignUp ? "Create an account to save your spots" : "Sign in to access your collection"}
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              description={isSignUp ? "Minimum 6 characters" : ""}
            />
            
            {error && (
              <p className="text-sm text-red-500">❌ {error}</p>
            )}
            
            {message && (
              <p className="text-sm text-green-600">✅ {message}</p>
            )}

            <Button
              type="submit"
              className="bg-zinc-900 text-amber-100"
              isLoading={loading}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-amber-600 hover:text-amber-700 hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
