import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
        <Logo />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} TaskFlow. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground">
            Entrar
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Criar conta
          </Link>
        </div>
      </div>
    </footer>
  );
}
