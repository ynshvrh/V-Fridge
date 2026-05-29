"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

// Minimal subset of the Google Identity Services API we use.
type GoogleCredentialResponse = { credential: string };

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
    },
  ): void;
};

declare global {
  interface Window {
    google?: {
      accounts?: { id?: GoogleAccountsId };
    };
  }
}

export function GoogleSignInButton({ next }: { next?: string }) {
  const t = useTranslations();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);

  // Render the Google-supplied button once both the script and our DOM target exist.
  // The renderedRef guard keeps this idempotent without a state-write inside the effect.
  useEffect(() => {
    if (!scriptReady || renderedRef.current || !clientId || !buttonRef.current) return;
    const gsi = window.google?.accounts?.id;
    if (!gsi) return;

    gsi.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await loginWithGoogle(response.credential);
          router.push(next ?? "/");
        } catch (err) {
          toast.error(getErrorMessage(err, t("googleSignInFailed")));
        }
      },
    });

    gsi.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 320,
    });
    renderedRef.current = true;
  }, [scriptReady, clientId, loginWithGoogle, router, next, t]);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  );
}
