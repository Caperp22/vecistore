import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { Providers } from "../components/Providers";
import { ThemeProvider } from "../components/ThemeProvider";
import { Toaster } from 'sonner';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Un toque más comercial al título y descripción
export const metadata: Metadata = {
  title: "VeciStore | Tienda Creativa",
  description: "Descubre amigurumis, impresión 3D y creaciones únicas hechas a medida.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Añadimos min-h-screen y flex flex-col para estructurar la página perfecta */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FAFAFA] dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 selection:bg-indigo-500 selection:text-white min-h-screen flex flex-col`}>
        <ThemeProvider>
          <Providers>
            {/* Le decimos al Toaster que respete el modo oscuro del sistema */}
            <Toaster position="top-center" richColors theme="system" /> 
            
            <Navbar />
            
            {/* flex-grow hace que esto empuje al footer siempre hacia abajo */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col">
              {children}
            </main>

            {/* FOOTER MINIMALISTA */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800/60 bg-white/50 dark:bg-[#0A0A0A]/50 backdrop-blur-md mt-auto transition-colors duration-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                  © {new Date().getFullYear()} VeciStore. Todos los derechos reservados.
                </p>
                <div className="flex gap-6 text-sm font-bold text-zinc-400">
                  <span className="hover:text-indigo-500 transition-colors cursor-pointer">Instagram</span>
                  <span className="hover:text-indigo-500 transition-colors cursor-pointer">WhatsApp</span>
                </div>
              </div>
            </footer>

          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}