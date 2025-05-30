"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, BookOpen, Bell, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoachIdDisplay from "./CoachIdDisplay";
import Image from "next/image";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md shadow-sm py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <div
              className="cursor-pointer flex items-center space-x-2"
              onClick={() => router.push("/")}
            >
              <Image
                src="/images/logo.png"
                alt="Coach Portal Logo"
                width={300}
                height={300}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                priority
              />

            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              className="flex items-center space-x-2"
              onClick={() => router.push("/")}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant={isActive("/course") ? "default" : "ghost"}
              className="flex items-center space-x-2"
              onClick={() => router.push("/course")}
            >
              <BookOpen className="w-4 h-4" />
              <span>Courses</span>
            </Button>
            <Button
              variant={isActive("/profile") ? "default" : "ghost"}
              className="flex items-center space-x-2"
              onClick={() => router.push("/profile")}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Button>
            <CoachIdDisplay excute={setIsMobileMenuOpen} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="bg-card shadow-md px-2 py-4 border-t">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              className="w-full flex items-center space-x-2 justify-start py-3 mb-2"
              onClick={() => {
                router.push("/");
                setIsMobileMenuOpen(false);
              }}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant={isActive("/courses") ? "default" : "ghost"}
              className="w-full flex items-center space-x-2 justify-start py-3 mb-2"
              onClick={() => {
                router.push("/courses");
                setIsMobileMenuOpen(false);
              }}
            >
              <BookOpen className="w-5 h-5" />
              <span>Courses</span>
            </Button>
            <Button
              variant={isActive("/notifications") ? "default" : "ghost"}
              className="w-full flex items-center space-x-2 justify-start py-3 mb-2"
              onClick={() => {
                router.push("/notifications");
                setIsMobileMenuOpen(false);
              }}
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </Button>
            <Button
              variant={isActive("/profile") ? "default" : "ghost"}
              className="w-full flex items-center space-x-2 justify-start py-3"
              onClick={() => {
                router.push("/profile");
                setIsMobileMenuOpen(false);
              }}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Button>
            <CoachIdDisplay excute={setIsMobileMenuOpen} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
