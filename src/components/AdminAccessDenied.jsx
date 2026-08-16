import React from "react";
import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AdminAccessDenied() {
  const navigate = useNavigate();

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="min-h-screen bg-steel-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-navy-100 rounded-xl p-8 text-center shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <ShieldX className="w-7 h-7 text-red-600" />
        </div>
        <h1 className="font-display font-bold text-2xl text-navy-500">Admin Access Required</h1>
        <p className="mt-3 text-sm text-navy-300 leading-6">
          Your account is authenticated, but it does not have the <strong>admin</strong> role required to access the KEM management portal.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>Back to Website</Button>
          <Button onClick={handleLogout} className="bg-navy-500 text-white hover:bg-navy-400">Logout</Button>
        </div>
      </div>
    </div>
  );
}
