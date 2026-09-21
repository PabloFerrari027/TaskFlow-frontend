"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ProfilePhotoCard } from "@/features/auth/components/profile-photo-card";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu perfil"
        description="Personalize como você aparece para os outros membros."
      />
      <ProfilePhotoCard />
    </div>
  );
}
