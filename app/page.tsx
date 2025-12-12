// app/page.tsx
import { stackServerApp } from "@/stack/server";
import Link from "next/link";
import {
  Boxes,
  Building2,
  Receipt,
  ShoppingCart,
  PackagePlus,
  BarChart3,
  Layers3,
  Users,
  User,
  Truck,
  Phone,
  ArrowRight,
  Zap,
} from "lucide-react";

export default async function OrderlyPage() {
  const user = await stackServerApp.getUser();

  // Signed-in experience: short and simple
  if (user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
        <div className="max-w-3xl w-full space-y-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Welcome back, {user.displayName ?? "there"} 👋
          </h1>
          <p className="text-lg text-slate-300">
            Continue managing your Products, Customers, Suppliers, Orders,
            Invoices, Inventory, Reports, and Team.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/handler/account-settings"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800"
            >
              Account Settings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Unsigned users → landing with static gradient background and essential messaging
  return (
    <main className="relative min-h-screen text-white overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header (minimal) */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-cyan-500/90 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-slate-900" />
          </div>
          <span className="text-xl font-bold tracking-tight">Orderly</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-10 pt-10 md:pt-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            {/* <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              All your business essentials in{" "}
              <span className="text-cyan-400">one place</span>.
            </h1>
            <p className="text-lg text-slate-200">
              Manage products, customers, suppliers, and contacts. Track
              purchase orders, sales orders, invoices, and inventory—without
              manual chaos or missing documents. Everything is securely stored
              and available <strong>24/7</strong>, anytime, anywhere.
            </p> */}

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              A free, open‑source toolkit to run your{" "}
              <span className="text-cyan-400">small business</span>.
            </h1>
            <p className="text-lg text-slate-200">
              Simple, tidy, and focused on the essentials—no premium upsells, no
              fluff. You own your data. Ideal for small to medium organisations
              that can’t—or shouldn’t have to—buy expensive software.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500"
              >
                Create your workspace <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800"
              >
                Explore features
              </a>
            </div>
            <div className="pt-2 text-sm text-slate-400">
              Free & Open Source. Self‑managed. No pricing, no lock‑in.
            </div>
          </div>

          {/* Hero visual: simple panel */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 backdrop-blur p-4 md:p-6 shadow-xl">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MiniCard
                  title="Products"
                  icon={<Boxes className="w-4 h-4" />}
                />
                <MiniCard
                  title="Org Data"
                  icon={<Building2 className="w-4 h-4" />}
                />
                <MiniCard
                  title="Customers"
                  icon={<User className="w-4 h-4" />}
                />
                <MiniCard
                  title="Suppliers"
                  icon={<Truck className="w-4 h-4" />}
                />
                <MiniCard
                  title="Contacts"
                  icon={<Phone className="w-4 h-4" />}
                />
                <MiniCard
                  title="Invoices"
                  icon={<Receipt className="w-4 h-4" />}
                />
                <MiniCard
                  title="Sales Orders"
                  icon={<ShoppingCart className="w-4 h-4" />}
                />
                <MiniCard
                  title="Purchase Orders"
                  icon={<PackagePlus className="w-4 h-4" />}
                />
                <MiniCard
                  title="Inventory"
                  icon={<Layers3 className="w-4 h-4" />}
                />
                <MiniCard
                  title="Reports"
                  icon={<BarChart3 className="w-4 h-4" />}
                />
                <MiniCard title="Team" icon={<Users className="w-4 h-4" />} />
              </div>
              <div className="mt-6 h-36 rounded-lg bg-linear-to-r from-cyan-500/15 via-fuchsia-500/10 to-indigo-500/15 border border-slate-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 px-6 md:px-10 py-16 md:py-24"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">
            Only what you need to operate
          </h2>
          <p className="mt-3 text-slate-200">
            Keep operations lean with essential modules. No fancy add‑ons—just
            the key flows to run your business end‑to‑end.
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <Feature
              icon={<Boxes className="w-5 h-5 text-cyan-400" />}
              title="Products"
              desc="Create and manage items with basic attributes, SKUs, cost/price, and status."
            />
            <Feature
              icon={<Building2 className="w-5 h-5 text-cyan-400" />}
              title="Organisation Data"
              desc="Company profile, addresses, taxes, and basic settings that power documents."
            />
            <Feature
              icon={<User className="w-5 h-5 text-cyan-400" />}
              title="Customers"
              desc="Maintain customer records, contacts, and full sales history."
            />
            <Feature
              icon={<Truck className="w-5 h-5 text-cyan-400" />}
              title="Suppliers"
              desc="Track supplier info, purchase history, and open POs."
            />
            <Feature
              icon={<Phone className="w-5 h-5 text-cyan-400" />}
              title="Contacts"
              desc="Centralized contact management for quick communication and reference."
            />
            <Feature
              icon={<Receipt className="w-5 h-5 text-cyan-400" />}
              title="Invoices"
              desc="Generate clean invoices from orders. Track paid/unpaid and export to PDF."
            />
            <Feature
              icon={<ShoppingCart className="w-5 h-5 text-cyan-400" />}
              title="Sales Orders"
              desc="Capture customer orders with statuses like Draft, Confirmed, Fulfilled."
            />
            <Feature
              icon={<PackagePlus className="w-5 h-5 text-cyan-400" />}
              title="Purchase Orders"
              desc="Raise POs to suppliers. Receive against POs to update inventory."
            />
            <Feature
              icon={<Layers3 className="w-5 h-5 text-cyan-400" />}
              title="Inventory"
              desc="In/out stock updates from POs/SOs. See on‑hand and low‑stock alerts."
            />
            <Feature
              icon={<BarChart3 className="w-5 h-5 text-cyan-400" />}
              title="Reports"
              desc="Basic totals: sales, purchases, receivables, payables—by period."
            />
            <Feature
              icon={<Users className="w-5 h-5 text-cyan-400" />}
              title="Team Management"
              desc="Invite teammates, assign simple roles, collaborate on orders and documents."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <Step
              n={1}
              title="Create workspace"
              desc="Sign up, add organisation details, and invite your team."
            />
            <Step
              n={2}
              title="Add master data"
              desc="Add products, customers, suppliers, and contacts; set basic taxes and document settings."
            />
            <Step
              n={3}
              title="Operate daily"
              desc="Raise POs and SOs, issue invoices, track stock and totals. Access records 24/7 with simple search."
            />
          </div>
        </div>
      </section>

      {/* Philosophy / OSS */}
      <section className="relative z-10 px-6 md:px-10 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold">
              Free & Open Source — your data, your rules
            </h3>
            <div className="mt-3 text-slate-200 space-y-2">
              <p>
                Orderly is built for small to medium organisations that want a
                reliable system without premium price tags. It’s simple, tidy,
                and focused on the essentials. You own your data and can access
                it whenever you need.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>No pricing tiers or upsells.</li>
                <li>No support promises—self‑serve by design.</li>
                <li>
                  Essential modules today; more can come in future releases.
                </li>
                <li>
                  All documents in one place—<strong>available 24/7</strong>.
                </li>
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              {/* If you have a public repo/docs, link them here */}
              {/* <Link href="https://github.com/yourorg/orderly" className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800">GitHub</Link> */}
              {/* <Link href="/docs" className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800">Docs</Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* Footer (simple) */}
      <footer className="relative z-10 px-6 md:px-10 pb-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-sm text-slate-300">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/90 flex items-center justify-center">
                <Zap className="h-4 w-4 text-slate-900" />
              </div>
              <span className="text-white font-semibold">Orderly</span>
            </div>
            <p className="mt-3">
              Simple, tidy, and open source. Built to help small businesses run
              with clarity.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium">Product</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="#features" className="hover:underline">
                  Features
                </a>
              </li>
              {/* <li><Link href="/docs" className="hover:underline">Docs</Link></li> */}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium">Community</h4>
            <ul className="mt-3 space-y-2">
              {/* Replace with your channels if any */}
              {/* <Link href="/changelog" className="hover:underline">Changelog</Link> */}
              {/* <Link href="/contribute" className="hover:underline">Contribute</Link> */}
              <li className="text-slate-500">
                Self‑managed. No official support.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Orderly — Free & Open Source.
        </div>
      </footer>
    </main>
  );
}

/* ---------------- Subcomponents ---------------- */

function MiniCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 flex items-center gap-2">
      <div className="h-8 w-8 rounded-md bg-slate-800/80 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm text-slate-200">{title}</span>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-slate-800/80 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-slate-200">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-cyan-600 text-slate-900 font-bold flex items-center justify-center">
          {n}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-slate-200">{desc}</p>
    </div>
  );
}
