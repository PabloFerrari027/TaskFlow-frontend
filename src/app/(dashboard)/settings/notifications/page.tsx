"use client";

import { PageHeader } from "@/components/shared/page-header";
import { NotificationPreferencesSection } from "@/features/notifications/components/notification-preferences-section";

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notificações"
        description="Os avisos aparecem no sino, no topo da tela. Aqui você escolhe quais quer receber e quais também chegam por e-mail."
      />
      <NotificationPreferencesSection />
    </div>
  );
}
