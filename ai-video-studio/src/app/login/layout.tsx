// Force /login to be server-rendered, not statically generated
// This prevents build errors when NEXT_PUBLIC_SUPABASE_URL is not set at build time
export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
