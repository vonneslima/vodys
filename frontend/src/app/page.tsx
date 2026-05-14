import { redirect } from 'next/navigation';

// Root route — redirect based on auth state is handled client-side in layout.
// This server component just bounces to /login as the default entry point.
export default function RootPage() {
  redirect('/login');
}
