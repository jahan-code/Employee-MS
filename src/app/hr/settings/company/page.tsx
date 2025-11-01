import { CompanySettingsForm } from "@/components/hr/company-settings-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company profile",
  description: "Manage company branding and HR portal details.",
};

export default function CompanySettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Company profile</h1>
        <p className="text-sm text-muted-foreground">
          Update the information employees see across the HR portal.
        </p>
      </div>
      <CompanySettingsForm />
    </div>
  );
}
