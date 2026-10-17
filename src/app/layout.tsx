import "./globals.css";

export const metadata: any = {
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
