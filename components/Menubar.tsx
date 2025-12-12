"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { SignIn, UserButton, useUser } from "@stackframe/stack";
import SignOutButton from "./sign-out-button";
import { stackServerApp } from "@/stack/server";

export default function Menubar() {
  // const user = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/home", icon: "" },
    { name: "Dashboard", href: "/dashboard", icon: "" },
    { name: "Products", href: "/products", icon: "" },
    { name: "Orders", href: "/orders", icon: "" },
    { name: "Order Items", href: "/order-items", icon: "" },
    { name: "Customers", href: "/customers", icon: "" },
    { name: "Purchases", href: "/purchases", icon: "" },
    { name: "Suppliers", href: "/suppliers", icon: "" },
    { name: "Contacts", href: "/contacts", icon: "" },
    { name: "Org", href: "/org", icon: "🏢" },
  ];

  return (
    <Suspense>
      {/* Top Navigation Bar */}
      <nav className="print:hidden bg-slate-100 border-b border-gray-300 fixed w-full z-50">
        <div className="flex justify-between items-center px-4 py-2 md:px-6">
          <h1 className="text-xl font-bold text-cyan-400 hover:text-cyan-500">
            <Link href={"/"}>Orderly </Link>
          </h1>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <ul className="flex gap-6 text-sm font-light">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200 ${
                      pathname === item.href
                        ? "bg-gray-200 text-black font-semibold"
                        : ""
                    }`}
                  >
                    {item.icon} {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Profile Section for Desktop */}
            <div className="flex items-center gap-3 ml-6 border-l pl-6 ">
              <User className="w-6 h-6 text-gray-600" />
              <span className="text-gray-700 font-medium">Admin User</span>
              {/* <button
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
                onClick={() => alert("Logging out...")}
              >
                <LogOut className="w-5 h-5" /> Logout
              </button> */}
            </div>
          </div>

          <UserButton showUserInfo />

          {/* Profile Section for Desktop */}
          {/* <div className="flex items-center gap-3 ml-6 border-l pl-6">
            <User className="w-6 h-6 text-gray-600" />
            <Link href={"/handler/sign-in"}> Sign in</Link>
          </div> */}

          {/* Profile Section for Desktop */}
          {/* <div className="flex items-center gap-3 ml-6 border-l pl-6">
            <User className="w-6 h-6 text-gray-600" />
            <SignOutButton />
            <p></p>
          </div> */}

          {/* Hamburger Button for Mobile */}
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 rounded hover:bg-gray-200 focus:outline-none"
            aria-label="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sliding Sidebar for Mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded hover:bg-gray-200 focus:outline-none"
            aria-label="Close Menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-4 p-4 text-lg font-light">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200 ${
                  pathname === item.href
                    ? "bg-blue-100 text-black font-semibold"
                    : ""
                }`}
              >
                {item.icon} {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Profile Section for Mobile */}
        <div className="absolute bottom-0 w-full border-t p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            {/* <User className="w-6 h-6 text-gray-600" />
            <span className="text-gray-700 font-medium">Admin User</span>
          </div>
          <button
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
            onClick={() => alert("Logging out...")}
          >
            <LogOut className="w-5 h-5" /> Logout
          </button> */}

            <div className="flex items-center gap-3 ml-6 border-l pl-6">
              <User className="w-6 h-6 text-gray-600" />
              <span className="text-gray-700 font-medium">Admin User</span>
              {/* <UserButton showUserInfo /> */}
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
