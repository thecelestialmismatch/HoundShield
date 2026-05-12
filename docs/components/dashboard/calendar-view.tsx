'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  RotateCcw,
  Terminal,
  Bell,
  CalendarDays,
  Plus,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = 'scheduled' | 'recurring' | 'cron' | 'reminder';

interface CalEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  description?: string;
  agentName?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<EventType, { color: string; icon: React.ElementType; label: string }> = {
  scheduled: { color: '#16a34a', icon: Calendar, label: 'Scheduled' },
  recurring: { color: '#3b82f6', icon: RotateCcw, label: 'Recurring' },
  cron: { color: '#8b5cf6', icon: Terminal, label: 'Cron Job' },
  reminder: { color: '#f59e0b', icon: Bell, label: 'Reminder' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateSampleEvents(): CalEvent[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = (day: number) => `${y}-${pad(m + 1)}-${pad(day)}`;

  return [
    { id: 'e1', title: 'Weekly Compliance Scan', type: 'recurring', date: dateStr(Math.min(today.getDate(), 28)), time: '09:00', agentName: 'Sentinel' },
    { id: 'e2', title: 'SOC 2 Evidence Snapshot', type: 'cron', date: dateStr(Math.min(today.getDate() + 1, 28)), time: '02:00', agentName: 'Aegis', description: 'Automated SOC 2 evidence collection at 2AM' },
    { id: 'e3', title: 'Vendor Risk Review', type: 'scheduled', date: dateStr(Math.min(today.getDate() + 2, 28)), time: '14:00', agentName: 'Cipher' },
    { id: 'e4', title: 'Policy Renewal Reminder', type: 'reminder', date: dateStr(Math.min(today.getDate() + 3, 28)), time: '10:00', description: 'Data privacy policy expires in 30 days' },
    { id: 'e5', title: 'Daily Log Aggregation', type: 'cron', date: dateStr(Math.min(today.getDate(), 28)), time: '00:30', agentName: 'Hound Shield Prime' },
    { id: 'e6', title: 'Newsletter Draft Due', type: 'scheduled', date: dateStr(Math.min(today.getDate() + 5, 28)), time: '17:00', agentName: 'Scribe' },
    { id: 'e7', title: 'Quarterly Board Report', type: 'reminder', date: dateStr(Math.min(today.getDate() + 7, 28)), time: '09:00', description: 'Prepare quarterly board compliance report' },
    { id: 'e8', title: 'Threat Intel Digest', type: 'recurring', date: dateStr(Math.min(today.getDate() + 1, 28)), time: '08:00', agentName: 'Nova' },
    { id: 'e9', title: 'API Rate Limit Check', type: 'cron', date: dateStr(Math.min(today.getDate() + 4, 28)), time: '06:00', agentName: 'Sentinel' },
    { id: 'e10', title: 'Team Standup Sync', type: 'recurring', date: dateStr(Math.min(today.getDate(), 28)), time: '10:30', agentName: 'Hound Shield Prime' },
    // Some events on earlier dates for visual variety
    { id: 'e11', title: 'Infrastructure Audit', type: 'scheduled', date: dateStr(5), time: '11:00', agentName: 'Forge' },
    { id: 'e12', title: 'Data Backup Cron', type: 'cron', date: dateStr(12), time: '03:00', agentName: 'Sentinel' },
    { id: 'e13', title: 'Compliance Training', type: 'reminder', date: dateStr(18), time: '14:00', description: 'Annual compliance training deadline' },
    { id: 'e14', title: 'Monthly Risk Report', type: 'recurring', date: dateStr(1), time: '09:00', agentName: 'Cipher' },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarView() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events] = useState<CalEvent[]>(generateSampleEvents);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = (day: number) => `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const eventsForDay = (day: number) => events.filter((e) => e.date === dateStr(day));
  const selectedEvents = selectedDay ? events.filter((e) => e.date === selectedDay) : [];

  // Upcoming events (next 7 days from real today)
  const upcoming = useMemo(() => {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return events
      .filter((e) => {
        const d = new Date(e.date + 'T00:00:00');
        return d >= start && d < end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [events]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDay(null);
  };
  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(todayStr);
  };

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="min-h-full bg-[#0c0c10]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Calendar</h2>
            <p className="text-sm text-slate-500 mt-0.5">Scheduled tasks, cron jobs, and reminders</p>
          </div>
          <div className="flex items-center gap-1">
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, conf]) => (
              <div key={key} className="flex items-center gap-1 text-xs text-slate-500 mr-3">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.color }} />
                <span>{conf.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 flex gap-6">
        {/* Calendar Grid */}
        <div className="flex-1">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/[0.03] text-slate-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-semibold text-white min-w-[180px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/[0.03] text-slate-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={goToday}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors"
            >
              Today
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 bg-white rounded-xl border border-white/10 overflow-hidden">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-24 border-b border-r border-white/10 bg-[#0c0c10]/50" />;
              }
              const ds = dateStr(day);
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDay;
              const dayEvents = eventsForDay(day);

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(isSelected ? null : ds)}
                  className={`h-24 border-b border-r border-white/10 p-1.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-500/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-indigo-500 text-white' : 'text-slate-200'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] text-slate-400 font-medium">{dayEvents.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const conf = EVENT_TYPE_CONFIG[ev.type];
                      return (
                        <div
                          key={ev.id}
                          className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-medium truncate"
                          style={{ backgroundColor: conf.color + '18', color: conf.color }}
                        >
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: conf.color }} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <p className="text-[9px] text-slate-400 pl-1">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Selected day events */}
          {selectedDay && (
            <div className="bg-white rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h4>
                <button onClick={() => setSelectedDay(null)} className="p-1 rounded hover:bg-white/[0.03] text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {selectedEvents.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No events on this day</p>
                )}
                {selectedEvents.map((ev) => {
                  const conf = EVENT_TYPE_CONFIG[ev.type];
                  const Icon = conf.icon;
                  return (
                    <div key={ev.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: conf.color + '18' }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: conf.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{ev.title}</p>
                        {ev.time && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{ev.time}</span>
                          </div>
                        )}
                        {ev.agentName && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Agent: {ev.agentName}</p>
                        )}
                        {ev.description && (
                          <p className="text-xs text-slate-500 mt-1">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming events */}
          <div className="bg-white rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" style={{ color: '#6366f1' }} />
                <h4 className="text-sm font-semibold text-white">Upcoming (7 days)</h4>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {upcoming.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No upcoming events</p>
              )}
              {upcoming.map((ev) => {
                const conf = EVENT_TYPE_CONFIG[ev.type];
                const Icon = conf.icon;
                const evDate = new Date(ev.date + 'T00:00:00');
                const dayLabel =
                  ev.date === todayStr
                    ? 'Today'
                    : evDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div key={ev.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: conf.color + '18' }}
                    >
                      <Icon className="w-3 h-3" style={{ color: conf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{dayLabel}</span>
                        {ev.time && <span className="text-[10px] text-slate-400">{ev.time}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
