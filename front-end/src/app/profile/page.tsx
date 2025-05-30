"use client";

import { useCoachStore } from "@/store/useCoachStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCoachProfile } from "@/hooks/useCoachProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, Shield } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const { coachId, hydrated } = useCoachStore();
  const router = useRouter();
  const { coachProfile, isProfileLoading, profileError, isProfileError } =
    useCoachProfile(coachId ? Number(coachId) : null);

  useEffect(() => {
    if (hydrated && !coachId) {
      router.push("/login");
    }
  }, [coachId, hydrated, router]);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
          My Profile
        </h1>
        <p
          className="text-muted-foreground mb-8 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          Manage your personal information and account settings
        </p>

        {isProfileLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : isProfileError ? (
          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-md max-w-2xl mx-auto">
            <p className="font-medium">Error loading profile</p>
            <p>{profileError?.message || "An unexpected error occurred."}</p>
          </div>
        ) : !coachProfile ? (
          <div className="bg-muted border-l-4 border-muted-foreground text-muted-foreground p-4 rounded-md max-w-2xl mx-auto">
            <p>No profile data found.</p>
          </div>
        ) : (
          <Card
            className="max-w-2xl mx-auto animate-fade-in shadow-sm border-border/80"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="bg-muted/50 rounded-t-xl border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Image
                    src="/images/logo.png"
                    alt="Coach Portal Logo"
                    width={100}
                    height={100}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl text-foreground">
                    {coachProfile.fullName}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Coach ID: {coachId}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Email Address
                  </label>
                  <p className="mt-1 text-foreground">{coachProfile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Phone Number
                  </label>
                  <p className="mt-1 text-foreground">
                    {coachProfile.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Account Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        coachProfile.status?.toLowerCase() === "active"
                          ? "default"
                          : "outline"
                      }
                      className={
                        coachProfile.status?.toLowerCase() === "active"
                          ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                      }
                    >
                      {coachProfile.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
