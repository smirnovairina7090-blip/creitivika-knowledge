import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Креайтивика - база знаний",
  description: "Ситуации на занятиях, действия преподавателя и менеджера, сообщения родителям и новые вопросы.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
