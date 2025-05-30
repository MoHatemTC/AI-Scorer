"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoachStore } from "@/store/useCoachStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LoginPage() {
  const [coachId, setCoachId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCoachId: storeCoachId, isLoggedIn } = useCoachStore();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coachId.trim()) return;

    setIsLoading(true);

    try {
      storeCoachId(coachId);

      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md border rounded-lg bg-card text-card-foreground shadow-lg">
        <div className="flex flex-col space-y-1.5 p-6">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/images/logo.png"
              alt="Coach Portal Logo"
              width={300}
              height={300}
              className="w-12 h-12 sm:w-50 sm:h-auto object-contain"
              priority
            />
          </div>
          <h3 className="text-2xl font-bold text-center">Coach View</h3>
          <p className="text-sm text-muted-foreground text-center">
            Enter your Coach ID to continue
          </p>
        </div>
        <div className="p-6 pt-0">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Input
                id="coachId"
                placeholder="Enter your Coach ID"
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="w-full"
                disabled={isLoading}
                autoComplete="off"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !coachId.trim()}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
