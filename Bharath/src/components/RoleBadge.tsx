import React from "react";
import { UserRole } from "../types";
import { Shield, UserCheck, Stethoscope } from "lucide-react";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md" | "lg";
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = "md" }) => {
  const getRoleConfig = () => {
    switch (role) {
      case "ADMIN":
        return {
          label: "Admin",
          icon: Shield,
          bg: "bg-[#FAF0EE] text-[#B85D52] border-[#E8D2CC]",
        };
      case "DERMATOLOGIST":
        return {
          label: "Dermatologist",
          icon: Stethoscope,
          bg: "bg-[#F0F5F1] text-[#4A6B53] border-[#8BA88E]/50",
        };
      case "USER":
      default:
        return {
          label: "User",
          icon: UserCheck,
          bg: "bg-[#F0F5F8] text-[#557889] border-[#8BA8B6]/40",
        };
    }
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
    lg: "px-3 py-1.5 text-sm gap-2 font-medium",
  };

  return (
    <span
      id={`role-badge-${role.toLowerCase()}`}
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
