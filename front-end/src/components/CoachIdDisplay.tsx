"use client";

import { useCoachStore } from "@/store/useCoachStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";

export default function CoachIdDisplay({excute}: {excute: (bool: boolean) => void}) {
  const { isLoggedIn, logout } = useCoachStore();
  const router = useRouter();

  const handleLogout = () => {
    excute(false);
    logout();
    router.push("/login");
  };

  if (!isLoggedIn) {
    return (
        <Button onClick={() => 
        { 
          excute(false); 
          router.push("/login");
        }}>
          <LogIn className="mr-2" size={16} />
          Login
          </Button>
    )
  }

  return (
      <Button onClick={handleLogout}>
        <LogOut className="mr-2" size={16} />
        Logout
        </Button>
  );

}
