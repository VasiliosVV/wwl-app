import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Play } from 'lucide-react';
import EventBuilder from './EventBuilder';
import EventPlayer from './EventPlayer';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Stavy pro Builder a Player
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderEventId, setBuilderEventId] = useState(null);
  const [activeEventId, setActiveEventId] = useState(null);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 31 }, (_, i) => 2020 + i);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate);
      
    setEvents(data || []);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleMonthChange = (e) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1));
  const handleYearChange = (e) => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const openBuilderForDate = (day) => {
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(formattedDate);
    setBuilderEventId(null);
    setIsBuilderOpen(true);
  };

  const openBuilderForEvent = (eventId) => {
    setBuilderEventId(eventId);
    setIsBuilderOpen(true);
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startingDay = firstDay === 0 ? 6 : firstDay - 1; 

  const blanks = Array.from({ length: startingDay }, (_, i) => <div key={`blank-${i}`} className="p-4 bg-dark/30 border border-gray-800/50"></div>);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const formattedDateForCheck = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.event_date === formattedDateForCheck);

    return (
      <div key={`day-${day}`} className="min-h-[120px] p-2 bg-dark border border-gray-800 hover:border-accent/50 transition-colors relative group">
        <div className="flex justify-between items-start">
          <span className="font-bold text-gray-400">{day}</span>
          <button 
            onClick={() => openBuilderForDate(day)}
            className="opacity-0 group-hover:opacity-100 bg-accent text-white rounded-full p-1 transition-opacity"
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="mt-2 space-y-1">
          {dayEvents.map(ev => (
            <div 
              key={ev.id} 
              className={`flex justify-between items-center text-xs p-1 rounded border ${ev.status === 'Completed' ? 'bg-green-900/50 text-green-400 border-green-800' : 'bg-blue-900/50 text-blue-400 border-blue-800'}`}
            >
              <span className="cursor-pointer truncate flex-1" onClick={() => openBuilderForEvent(ev.id)}>
                {ev.name}
              </span>
              
              {/* Play tlačítko pro spuštění Event Playeru */}
              {ev.status !== 'Completed' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveEventId(ev.id); }} 
                  className="ml-2 bg-accent text-white rounded-full p-0.5 hover:bg-white hover:text-black transition-colors"
                  title="Start Event"
                >
                  <Play size={12} fill="currentColor" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  });

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3"><CalIcon className="text-accent" /> Event Calendar</h2>
        
        <div className="flex gap-4 items-center bg-dark p-2 rounded-xl border border-gray-800">
          <button onClick={prevMonth} className="p-2 hover:text-accent"><ChevronLeft /></button>
          <select value={currentDate.getMonth()} onChange={handleMonthChange} className="bg-transparent font-bold outline-none cursor-pointer appearance-none text-center">
            {months.map((m, i) => <option key={m} value={i} className="bg-dark">{m}</option>)}
          </select>
          <select value={currentDate.getFullYear()} onChange={handleYearChange} className="bg-transparent font-bold outline-none cursor-pointer appearance-none text-center">
            {years.map(y => <option key={y} value={y} className="bg-dark">{y}</option>)}
          </select>
          <button onClick={nextMonth} className="p-2 hover:text-accent"><ChevronRight /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-gray-500 font-bold text-sm">
        <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks}
        {days}
      </div>

      <AnimatePresence>
        {isBuilderOpen && (
          <EventBuilder 
            date={selectedDate} 
            existingEventId={builderEventId}
            onClose={() => setIsBuilderOpen(false)} 
            onSave={() => { setIsBuilderOpen(false); fetchEvents(); }} 
          />
        )}
      </AnimatePresence>

      {/* Tady je narvanej ten Player */}
      {activeEventId && (
        <EventPlayer 
          eventId={activeEventId} 
          onClose={() => setActiveEventId(null)} 
          onFinish={() => { setActiveEventId(null); fetchEvents(); }} 
        />
      )}

    </div>
  );
}