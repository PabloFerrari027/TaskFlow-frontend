"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAssistantChannelsQuery } from "@/features/assistant-channels/hooks/use-assistant-channels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/shared/error-state";
import { NOTIFICATION_TYPE_LABEL } from "@/features/notifications/lib/notification-labels";
import {
  useNotificationPreferencesQuery,
  useSaveNotificationPreferenceMutation,
} from "@/features/notifications/hooks/use-notifications";
import { NOTIFICATION_TYPES, type NotificationPreference } from "@/types/notification";

export function NotificationPreferencesSection() {
  const preferencesQuery = useNotificationPreferencesQuery();
  const saveMutation = useSaveNotificationPreferenceMutation();

  const channelsQuery = useAssistantChannelsQuery();
  // The column only exists where the server has WhatsApp configured.
  const whatsapp = channelsQuery.data?.find((channel) => channel.channel === "whatsapp");
  const showWhatsApp = Boolean(whatsapp?.available);
  const whatsappLinked = Boolean(whatsapp?.link);

  const byType = new Map(preferencesQuery.data?.map((p) => [p.type, p]));

  function toggle(
    preference: NotificationPreference,
    channel: "inApp" | "email" | "whatsapp",
    value: boolean
  ) {
    saveMutation.mutate({ ...preference, [channel]: value });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>O que você quer receber</CardTitle>
        <CardDescription>
          Escolha, para cada tipo de aviso, se ele aparece no sino do TaskFlow e se também chega por
          e-mail{showWhatsApp ? " ou pelo WhatsApp" : ""}. Salva na hora.
        </CardDescription>
        {showWhatsApp && !whatsappLinked ? (
          <p className="text-xs text-muted-foreground">
            Para receber pelo WhatsApp, vincule seu número na página{" "}
            <Link href="/assistant" className="font-medium text-primary hover:underline">
              Assistente
            </Link>
            . Sem número vinculado, nada é enviado por lá.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {preferencesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : preferencesQuery.isError ? (
          <ErrorState error={preferencesQuery.error} onRetry={() => preferencesQuery.refetch()} />
        ) : (
          <div className="divide-y">
            <div
              className={cn(
                "hidden gap-4 pb-2 text-xs font-medium text-muted-foreground uppercase sm:grid",
                showWhatsApp ? "grid-cols-[1fr_5rem_5rem_5rem]" : "grid-cols-[1fr_5rem_5rem]"
              )}
            >
              <span>Aviso</span>
              <span className="text-center">No app</span>
              <span className="text-center">E-mail</span>
              {showWhatsApp ? <span className="text-center">WhatsApp</span> : null}
            </div>
            {NOTIFICATION_TYPES.map((type) => {
              // The server default for WhatsApp is on.
              const preference = byType.get(type) ?? { type, inApp: true, email: false, whatsapp: true };
              const label = NOTIFICATION_TYPE_LABEL[type];
              return (
                <div
                  key={type}
                  className={cn(
                    "grid items-center gap-4 py-3",
                    showWhatsApp
                      ? "grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_5rem_5rem_5rem]"
                      : "grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_5rem_5rem]"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{label.title}</p>
                    <p className="text-xs text-muted-foreground">{label.description}</p>
                  </div>
                  <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                    <Switch
                      checked={preference.inApp}
                      onCheckedChange={(value) => toggle(preference, "inApp", value)}
                      aria-label={`${label.title} no app`}
                    />
                    <span className="sm:hidden">App</span>
                  </label>
                  <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                    <Switch
                      checked={preference.email}
                      onCheckedChange={(value) => toggle(preference, "email", value)}
                      aria-label={`${label.title} por e-mail`}
                    />
                    <span className="sm:hidden">E-mail</span>
                  </label>
                  {showWhatsApp ? (
                    <label className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                      <Switch
                        checked={preference.whatsapp ?? true}
                        onCheckedChange={(value) => toggle(preference, "whatsapp", value)}
                        aria-label={`${label.title} pelo WhatsApp`}
                      />
                      <span className="sm:hidden">WhatsApp</span>
                    </label>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
