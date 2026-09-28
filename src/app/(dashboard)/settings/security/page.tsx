"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SecuritySettingsSection } from "@/features/auth/components/security-settings-section";
import { SessionsSettingsSection } from "@/features/sessions/components/sessions-settings-section";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Segurança"
        description="Gerencie a senha, o acesso com Google e os dispositivos conectados à sua conta."
      />
      <SecuritySettingsSection />
      <SessionsSettingsSection />
    </div>
  );
}
