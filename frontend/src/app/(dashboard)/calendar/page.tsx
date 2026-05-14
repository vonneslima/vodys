import type { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/CalendarView';

export const metadata: Metadata = { title: 'Calendar' };

export default function CalendarPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-0.5">View and manage your study schedule</p>
      </div>
      <CalendarView />
    </div>
  );
}
