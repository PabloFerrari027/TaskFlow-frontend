"use client";

import Script from "next/script";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  changePasswordSchema,
  linkGoogleSchema,
  setPasswordSchema,
  type ChangePasswordFormValues,
  type LinkGoogleFormValues,
  type SetPasswordFormValues,
} from "@/features/auth/schemas";
import {
  useChangePasswordMutation,
  useLinkGoogleMutation,
  useSetFirstPasswordMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import { useCurrentUserQuery } from "@/features/auth/hooks/use-current-user";
import { useGoogleIdentityToken } from "@/features/auth/hooks/use-google-identity-token";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * Account-level (not workspace) security settings. Lives only on the settings
 * screen — never linked from the assistant chat or its ReauthDialog, even
 * though both share `useGoogleIdentityToken`.
 *
 * Which form shows depends on `hasPassword` from GET /auth/me (same query the
 * ReauthDialog uses): a password account changes it, a Google-only account
 * sets its first one. A second card links Google to a password account.
 */
export function SecuritySettingsSection() {
  const currentUserQuery = useCurrentUserQuery();
  const currentUser = currentUserQuery.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {currentUser?.hasPassword ? "Alterar senha" : "Definir senha"}
          </CardTitle>
          <CardDescription>
            {currentUser?.hasPassword
              ? "Ao alterar a senha, suas outras sessões são desconectadas."
              : "Sua conta entra só com o Google. Defina uma senha para também poder entrar com e-mail e senha."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUserQuery.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : !currentUser ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(currentUserQuery.error)}
            </p>
          ) : currentUser.hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <SetPasswordForm googleLinked={currentUser.googleLinked} />
          )}
        </CardContent>
      </Card>

      {currentUser ? (
        <GoogleLinkCard
          hasPassword={currentUser.hasPassword}
          googleLinked={currentUser.googleLinked}
        />
      ) : null}
    </div>
  );
}

/**
 * "Vincular Google" for accounts that already have a password. Linking needs
 * both proofs — the current password and a fresh Google ID token — so a
 * Google-only account (nothing to link) shows no card at all. Unlinking is
 * intentionally not offered.
 */
function GoogleLinkCard({
  hasPassword,
  googleLinked,
}: {
  hasPassword: boolean;
  googleLinked: boolean;
}) {
  const canLink = hasPassword && !googleLinked;
  if (!googleLinked && !canLink) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conta Google</CardTitle>
        <CardDescription>
          {googleLinked
            ? "Você pode entrar com o Google nesta conta."
            : "Vincule sua conta Google para também poder entrar com ela. Suas outras sessões são desconectadas."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {googleLinked ? (
          <p className="text-sm text-muted-foreground">Conta Google vinculada.</p>
        ) : (
          <LinkGoogleForm />
        )}
      </CardContent>
    </Card>
  );
}

function LinkGoogleForm() {
  const linkGoogleMutation = useLinkGoogleMutation();
  const isPending = linkGoogleMutation.isPending;

  const form = useForm<LinkGoogleFormValues>({
    resolver: zodResolver(linkGoogleSchema),
    mode: "onChange",
    defaultValues: { currentPassword: "" },
  });

  // Same shape as SetPasswordForm: the Google button is the submit action —
  // GIS only hands over a fresh ID token when the user clicks the button it
  // renders, and that token goes straight into the request.
  const { buttonRef, scriptProps, isConfigured } = useGoogleIdentityToken({
    enabled: true,
    onCredential: async (googleIdToken) => {
      if (isPending) return;
      const valid = await form.trigger();
      if (!valid) return;

      linkGoogleMutation.mutate(
        { currentPassword: form.getValues("currentPassword"), googleIdToken },
        {
          onSuccess: () => form.reset(),
          onError: (error) => {
            if (getErrorCode(error) === "CURRENT_PASSWORD_INCORRECT") {
              form.setError("currentPassword", {
                message: getErrorMessage(error),
              });
            }
          },
        }
      );
    },
    buttonWidth: 280,
  });

  if (!isConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        O login com Google não está configurado neste ambiente.
      </p>
    );
  }

  return (
    <Form {...form}>
      <Script {...scriptProps} />
      <form
        onSubmit={(event) => event.preventDefault()}
        className="max-w-sm space-y-4"
      >
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha atual</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Para vincular, informe sua senha e escolha a conta Google.
          </p>
          <div
            className={cn(
              (!form.formState.isValid || isPending) &&
                "pointer-events-none opacity-60"
            )}
          >
            <div ref={buttonRef} />
          </div>
          {isPending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Vinculando…
            </p>
          ) : null}
        </div>
      </form>
    </Form>
  );
}

function ChangePasswordForm() {
  const changePasswordMutation = useChangePasswordMutation();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit({ currentPassword, newPassword }: ChangePasswordFormValues) {
    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => form.reset(),
        onError: (error) => {
          if (getErrorCode(error) === "CURRENT_PASSWORD_INCORRECT") {
            form.setError("currentPassword", {
              message: getErrorMessage(error),
            });
          }
        },
      }
    );
  }

  const isPending = changePasswordMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha atual</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Alterar senha
        </Button>
      </form>
    </Form>
  );
}

function SetPasswordForm({ googleLinked }: { googleLinked: boolean }) {
  const setFirstPasswordMutation = useSetFirstPasswordMutation();
  const isPending = setFirstPasswordMutation.isPending;

  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    mode: "onChange",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // The Google button is the submit action: GIS only hands over a fresh ID
  // token when the user clicks the button it renders, and that token goes
  // straight into the request below — it's never kept in state.
  const { buttonRef, scriptProps, isConfigured } = useGoogleIdentityToken({
    enabled: googleLinked,
    onCredential: async (googleIdToken) => {
      if (isPending) return;
      const valid = await form.trigger();
      if (!valid) return;

      setFirstPasswordMutation.mutate(
        { newPassword: form.getValues("newPassword"), googleIdToken },
        { onSuccess: () => form.reset() }
      );
    },
    buttonWidth: 280,
  });

  if (!googleLinked || !isConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Sua conta não tem um método disponível para confirmar sua identidade
        (nenhuma senha e nenhum Google vinculado), então não é possível definir
        uma senha agora.
      </p>
    );
  }

  return (
    <Form {...form}>
      <Script {...scriptProps} />
      <form
        onSubmit={(event) => event.preventDefault()}
        className="max-w-sm space-y-4"
      >
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Para definir a senha, confirme sua identidade com o Google.
          </p>
          <div
            className={cn(
              (!form.formState.isValid || isPending) &&
                "pointer-events-none opacity-60"
            )}
          >
            <div ref={buttonRef} />
          </div>
          {isPending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Definindo senha…
            </p>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
