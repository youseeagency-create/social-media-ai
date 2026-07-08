"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push(data.role === "admin" ? "/admin" : "/workspace");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm glass-strong rounded-2xl border-white/[0.08] p-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20">
          <Lock className="h-4 w-4 text-purple-400" />
        </div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Access your workspace</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl h-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
