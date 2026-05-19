import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="bg-aura flex min-h-screen items-center justify-center px-6 py-16">
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </div>
  );
}
