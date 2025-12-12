import { SignIn } from "@stackframe/stack";
import { StepBack } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-cyan-100">
      <div className="max-w-md w-full space-y-8">
        <SignIn
          extraInfo={
            <>
              When signing in, you agree to our <a href="/terms">T&C</a>
            </>
          }
        />
        <Link href={"/"}> Go Back 🏡</Link>
        {/* <StepBack /> */}
      </div>
    </div>
  );
}
