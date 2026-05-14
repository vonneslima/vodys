'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { Event } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  events: Event[];
  onDayClick: (date: Date) => void;
}

function CalendarDay({
  date,
  isCurrentMonth,
  events,
  onDayClick,
}: CalendarDayProps) {
  const dayEvents = events.filter((e) =>
    isSameDay(new Date(e.startAt), date)
  );

  return (
    <button
      onClick={() => onDayClick(date)}
      className={cn(
        'relative flex min-h-[90px] flex-col gap-1 rounded-lg p-2 text-left transition-colors hover:bg-accent/50',
        !isCurrentMonth && 'opacity-40',
        isToday(date) && 'ring-2 ring-primary ring-inset'
      )}
    >
      <span
        className={cn(
          'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
          isToday(date) && 'bg-primary text-primary-foreground'
        )}
      >
        {format(date, 'd')}
      </span>

      <div className="flex flex-col gap-0.5 overflow-hidden">
        {dayEvents.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: event.color }}
            title={event.title}
          >
            {event.title}
          </div>
        ))}

        {dayEvents.length > 3 && (
          <span className="text-[10px] text-muted-foreground pl-1.5">
            +{dayEvents.length - 3} more
          </span>
        )}
      </div>
    </button>
  );
}

export function CalendarView() {
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [title, setTitle] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const { data: events = [] } = useQuery({
    queryKey: ['events', format(monthStart, 'yyyy-MM')],
    queryFn: () =>
      api
        .get<{ data: Event[] }>(
          `/events?startAt=${calStart.toISOString()}&endAt=${calEnd.toISOString()}`
        )
        .then((r) => r.data.data),
  });

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      const endDate = new Date(selectedDate);
endDate.setHours(endDate.getHours() + 1);

await api.post('/events', {
  title,
  startAt: selectedDate.toISOString(),
  endAt: endDate.toISOString(),
  allDay: false,
  color: '#6366f1',
});

      queryClient.invalidateQueries({ queryKey: ['events'] });

      setShowModal(false);
      setTitle('');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar evento');
    }
  };

  const days = useMemo(() => {
    const result: Date[] = [];
    let d = calStart;

    while (d <= calEnd) {
      result.push(d);
      d = addDays(d, 1);
    }

    return result;
  }, [calStart, calEnd]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];

    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }

    return result;
  }, [days]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-xl font-semibold min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>

          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              setSelectedDate(new Date());
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="divide-y divide-border">
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 divide-x divide-border"
            >
              {week.map((day) => (
                <CalendarDay
                  key={day.toISOString()}
                  date={day}
                  isCurrentMonth={isSameMonth(day, currentMonth)}
                  events={events}
                  onDayClick={(d) => {
                    setSelectedDate(d);
                    setShowModal(true);
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowModal(false)}
        >
          <Card
            className="w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold">
              Create Event
            </h3>

            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'dd/MM/yyyy')}
            </p>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full rounded-md border bg-background p-2"
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}