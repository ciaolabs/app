export const clerkAppName = "Ciao! surveys";

const clerkContinueSubtitle = `to continue to ${clerkAppName}`;

export const clerkProviderAppearance = {
  variables: {
    colorPrimary: "var(--clay-slushie-500)",
    colorText: "var(--ink)",
    colorTextSecondary: "var(--ink-soft)",
    colorBackground: "var(--surface-panel-strong)",
    colorInputBackground: "var(--surface-panel-strong)",
    colorInputText: "var(--ink)",
    colorDanger: "var(--clay-pomegranate-400)",
    borderRadius: "1.5rem",
    fontFamily: "var(--font-body), sans-serif",
  },
} as const;

export const clerkLocalization = {
  signIn: {
    alternativePhoneCodeProvider: {
      subtitle: clerkContinueSubtitle,
      title: `Check your {{provider}} for ${clerkAppName}`,
    },
    emailCode: {
      subtitle: clerkContinueSubtitle,
    },
    emailCodeMfa: {
      subtitle: clerkContinueSubtitle,
    },
    emailLink: {
      subtitle: clerkContinueSubtitle,
    },
    emailLinkMfa: {
      subtitle: clerkContinueSubtitle,
    },
    phoneCode: {
      subtitle: clerkContinueSubtitle,
    },
    start: {
      title: `Sign in to ${clerkAppName}`,
      titleCombined: `Continue to ${clerkAppName}`,
      alternativePhoneCodeProvider: {
        title: `Sign in to ${clerkAppName} with {{provider}}`,
      },
    },
  },
  signUp: {
    emailLink: {
      subtitle: clerkContinueSubtitle,
    },
    start: {
      alternativePhoneCodeProvider: {
        title: `Sign up to ${clerkAppName} with {{provider}}`,
      },
    },
  },
} as const;

export const clerkSignInAppearance = {
  ...clerkProviderAppearance,
  elements: {
    rootBox: "w-full",
    cardBox:
      "w-full rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-0 shadow-[var(--shadow-soft)]",
    headerTitle: "font-display text-4xl text-[var(--ink)] tracking-[-0.03em]",
    headerSubtitle: "mt-2 text-sm leading-7 text-[var(--ink-soft)]",
    socialButtonsBlockButton:
      "clay-button-hover h-12 rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] text-[var(--ink)] shadow-[var(--shadow-soft)]",
    socialButtonsBlockButtonText: "font-semibold",
    dividerLine: "bg-[var(--line)]",
    dividerText: "text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]",
    formButtonPrimary:
      "clay-button-hover h-12 rounded-full border border-black bg-[var(--accent-blue)] text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]",
    formFieldLabel: "font-semibold text-[var(--ink-soft)]",
    formFieldInput:
      "h-12 rounded-[0.5rem] border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] text-[var(--ink)] shadow-none focus:ring-2 focus:ring-[var(--clay-focus)]",
    footerActionLink: "font-semibold text-[var(--accent-coral)] hover:text-[var(--accent-blue)]",
    identityPreviewText: "text-[var(--ink)]",
    formResendCodeLink: "font-semibold text-[var(--accent-coral)] hover:text-[var(--accent-blue)]",
    alertText: "text-sm text-[var(--accent-coral)]",
  },
} as const;

export const clerkUserButtonAppearance = {
  elements: {
    avatarBox: "h-11 w-11 rounded-full ring-1 ring-[var(--line-strong)] shadow-[var(--shadow-soft)]",
  },
} as const;
