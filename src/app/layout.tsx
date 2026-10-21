import "./globals.css";
import type { Metadata } from "next";
import { LEGAL, SITE_URL } from "@/lib/legal";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jaydi — interview prep you can listen to",
    template: "%s · Jaydi",
  },
  description:
    "Turn your resume and a job description into an interview-prep lecture, then listen to it in the car. The written lecture is free.",
  applicationName: "Jaydi",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Jaydi",
    url: SITE_URL,
    title: "Jaydi — interview prep you can listen to",
    description:
      "Turn your resume and a job description into an interview-prep lecture, then listen to it in the car.",
  },
  twitter: {
    card: "summary",
    title: "Jaydi — interview prep you can listen to",
    description:
      "Turn your resume and a job description into an interview-prep lecture, then listen to it in the car.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "apple-mobile-web-app-title": LEGAL.product,
  },
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
