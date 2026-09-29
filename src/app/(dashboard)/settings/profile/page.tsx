"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ProfilePhotoCard } from "@/features/auth/components/profile-photo-card";
import { SecuritySettingsSection } from "@/features/auth/components/security-settings-section";
import { SessionsSettingsSection } from "@/features/sessions/components/sessions-settings-section";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu perfil"
        description="Personalize como você aparece, gerencie a senha, o acesso com Google e os dispositivos conectados à sua conta."
      />
      <ProfilePhotoCard />
      <div id="seguranca" className="scroll-mt-6">
        <SecuritySettingsSection />
      </div>
      <SessionsSettingsSection />
    </div>
  );
}
