import "@/styles/design.css";
import { Manrope, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import Layout from "@/sections/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Fonts are declared here (next/font is not allowed in _document.tsx) and
// their resolved font-family strings are injected directly onto :root via a
// global <style> tag. This avoids the scoping problem we'd hit by applying
// the font className to a nested wrapper — design.css reads these
// variables from :root, so they must live there.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const queryClient = new QueryClient();

// Raw <style> with dangerouslySetInnerHTML — bypasses styled-jsx so the CSS
// variables are emitted identically in dev (SSR), standalone build (Electron)
// and static export. The React Compiler/SWC pipeline cannot strip this.
const fontVarsCss = `:root{--font-manrope:${manrope.style.fontFamily};--font-plus-jakarta:${plusJakarta.style.fontFamily};--font-jetbrains-mono:${jetbrainsMono.style.fontFamily};}`;

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <style dangerouslySetInnerHTML={{ __html: fontVarsCss }} />
      <Layout>
        <div key={router.asPath} className="page-transition">
          <Component {...pageProps} />
        </div>
      </Layout>
    </QueryClientProvider>
  );
}
