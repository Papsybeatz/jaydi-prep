import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jaydi - Interview Prep",
  description: "Interview preparation buddy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
