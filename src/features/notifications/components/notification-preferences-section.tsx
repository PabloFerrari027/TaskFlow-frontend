"use client";

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

  const byType = new Map(preferencesQuery.data?.map((p) => [p.type, p]));

  function toggle(preference: NotificationPreference, channel: "inApp" | "email", value: boolean) {
    saveMutation.mutate({ ...preference, [channel]: value });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>O que você quer receber</CardTitle>
        <CardDescription>
          Escolha, para cada tipo de aviso, se ele aparece no sino do TaskFlow e se também chega por
          e-mail. Salva na hora.
        </CardDescription>
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
            <div className="hidden grid-cols-[1fr_5rem_5rem] gap-4 pb-2 text-xs font-medium text-muted-foreground uppercase sm:grid">
              <span>Aviso</span>
              <span className="text-center">No app</span>
              <span className="text-center">E-mail</span>
            </div>
            {NOTIFICATION_TYPES.map((type) => {
              const preference = byType.get(type) ?? { type, inApp: true, email: false };
              const label = NOTIFICATION_TYPE_LABEL[type];
              return (
                <div
                  key={type}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 sm:grid-cols-[1fr_5rem_5rem]"
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
