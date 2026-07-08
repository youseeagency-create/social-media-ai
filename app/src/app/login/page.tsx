import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/workspace");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}
