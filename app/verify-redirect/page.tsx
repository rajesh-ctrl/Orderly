// app/verify-redirect/page.tsx
import { Suspense } from "react";
import ClientForward from "./ClientForward";
import Link from "next/link";

type SearchParams = { next?: string };

export default async function VerifyRedirectPage({
  searchParams,
}: {
  // 👇 In Server Components, this is a Promise
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams; // ✅ unwrap the Promise
  const next = sp?.next ?? "/handler/account-settings#auth";

  return (
    <main className="mx-auto max-w-lg p-6 bg-cyan-50 rounded-md border border-gray-50">
      <h1 className="text-xl font-semibold">Email verification required</h1>
      <p className="mt-2 text-gray-700">
        You’re being redirected to verify your account. This helps keep your
        data secure.
      </p>
      <p className="mt-2 text-gray-700">Please verify your Email!!</p>
      <div className="mt-6">
        <Suspense
          fallback={
            <span className="text-sm text-gray-500">Preparing redirect…</span>
          }
        >
          <AutoForward next={next} />
        </Suspense>
      </div>

      <Link
        href={next}
        className=" flex rounded-md px-4 py-2 text-white font-medium mt-4 bg-cyan-400 hover:bg-cyan-500 justify-center items-center"
      >
        Go now
      </Link>

      <p className="mt-2 mb-10 text-xs text-gray-500">
        If you are not redirected automatically, click “Go now”.
      </p>
    </main>
  );
}

function AutoForward({ next }: { next: string }) {
  return <ClientForward next={next} />;
}
