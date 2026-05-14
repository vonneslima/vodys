import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-6xl font-bold gradient-text">404</h1>
        <p className="mt-2 text-xl font-semibold">Page not found</p>
        <p className="mt-1 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
