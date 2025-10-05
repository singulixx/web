import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "@/components/ClientLayout";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Gigan Store Management — Created by Singulix",
  description: "Backoffice & inventory for Gigan Store Management, built by Singulix.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>

        {/* ✅ Toaster elegan dengan warna sesuai variant */}
        <Toaster
          position="top-right"
          closeButton
          duration={3500}
          toastOptions={{
            className:
              "rounded-lg shadow-lg text-sm border font-medium px-4 py-3",
          }}
        />
      </body>
    </html>
  );
}
