"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-3.5 w-3.5" />
      Log out
    </Button>
  );
}
