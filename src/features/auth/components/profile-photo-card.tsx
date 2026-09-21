"use client";

import * as React from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from "@/features/auth/api/auth-service";
import { useSelfIdentity } from "@/features/auth/hooks/use-current-user";
import {
  useUploadPhotoMutation,
  useUserPhotoUrl,
} from "@/features/auth/hooks/use-user-photo";
import { useAuth } from "@/lib/auth/auth-context";
import { getInitialsFromId } from "@/lib/format";

export function ProfilePhotoCard() {
  const { userId } = useAuth();
  const { label, initials } = useSelfIdentity();
  const photoUrl = useUserPhotoUrl(userId);
  const uploadMutation = useUploadPhotoMutation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    // The server decides by file content; this only spares a round trip.
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      toast.error("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error("A foto excede o limite de 5MB.");
      return;
    }

    uploadMutation.mutate(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de perfil</CardTitle>
        <CardDescription>
          Aparece para os outros membros nas tarefas, comentários e listas.
          JPEG, PNG ou WebP de até 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-16">
          {photoUrl ? <AvatarImage src={photoUrl} alt="Sua foto de perfil" /> : null}
          <AvatarFallback className="text-lg">
            {initials ?? (userId ? getInitialsFromId(userId) : "?")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-2">
          {label ? (
            <p className="truncate text-sm font-medium text-foreground">{label}</p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Camera />
            )}
            {photoUrl ? "Trocar foto" : "Enviar foto"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(",")}
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </CardContent>
    </Card>
  );
}
