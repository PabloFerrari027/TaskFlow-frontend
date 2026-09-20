"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SecuritySettingsSection } from "@/features/auth/components/security-settings-section";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Segurança"
        description="Gerencie a senha e o acesso com Google da sua conta."
      />
      <SecuritySettingsSection />
    </div>
  );
}
