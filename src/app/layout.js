import { Public_Sans, Source_Serif_4 } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export const metadata = {
  title: { default: "Admin – Al Hanna United Care", template: "%s | Al Hanna Admin" },
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#0a3431" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${publicSans.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
