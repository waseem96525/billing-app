import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  BarChart3,
  Settings,
  ShoppingCart,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POS & Inventory Management System",
  description: "Professional Point of Sale and Inventory Management System for Indian Market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gradient-to-br from-gray-50 to-gray-100`}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white flex-shrink-0 shadow-2xl">
            <div className="p-6 border-b border-indigo-700">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-indigo-900" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">SmartPOS</h1>
                  <p className="text-xs text-indigo-300">Pro Edition</p>
                </div>
              </div>
            </div>
            
            <nav className="p-4 space-y-2">
              <NavLink href="/" icon={<LayoutDashboard className="w-5 h-5" />}>
                Dashboard
              </NavLink>
              <NavLink href="/inventory" icon={<Package className="w-5 h-5" />}>
                Inventory
              </NavLink>
              <NavLink href="/customers" icon={<Users className="w-5 h-5" />}>
                Customers
              </NavLink>
              <NavLink href="/invoices" icon={<FileText className="w-5 h-5" />}>
                Invoices
              </NavLink>
              <NavLink href="/reports" icon={<BarChart3 className="w-5 h-5" />}>
                Reports
              </NavLink>
              <NavLink href="/settings" icon={<Settings className="w-5 h-5" />}>
                Settings
              </NavLink>
            </nav>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-700">
              <div className="text-xs text-indigo-300 text-center">
                <p>© 2026 SmartPOS</p>
                <p className="mt-1">Version 1.0.0</p>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <header className="bg-white shadow-md border-b border-gray-200 z-10">
              <div className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Point of Sale System
                    </h2>
                    <p className="text-sm text-gray-500">
                      Manage your business operations efficiently
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">
                        {new Date().toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </header>
            
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-800 transition-all duration-200 group"
    >
      <span className="text-indigo-300 group-hover:text-white transition-colors">
        {icon}
      </span>
      <span className="font-medium group-hover:text-white">{children}</span>
    </Link>
  );
}
