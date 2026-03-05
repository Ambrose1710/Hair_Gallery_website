import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus, DailyAvailability, Service, Category } from '../types';
import { STANDARD_SLOTS } from '../constants';
import { getCategoryDescription } from '../services/geminiService';

interface AdminDashboardProps {
  appointments: Appointment[];
  availability: DailyAvailability[];
  services: Service[];
  categories: Category[];
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  onUpdateAvailability: (date: string, time: string, isAvailable: boolean) => void;
  onUpdateServices: (services: Service[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  appointments,
  availability,
  services,
  categories,
  onUpdateAppointmentStatus,
  onUpdateAvailability,
  onUpdateServices,
  onUpdateCategories
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'services' | 'categories'>('appointments');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set([new Date().toISOString().split('T')[0]]));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({ name: '', subName: '', price: 0, duration: '', description: '', categoryId: categories[0]?.id || '' });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({ name: '', description: '' });
  const [emailConfigStatus, setEmailConfigStatus] = useState<{ configured: boolean; message: string } | null>(null);

  // Check Email Config
  React.useEffect(() => {
    fetch('/api/admin/email-status', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('hgs_auth_token')}` }
    })
    .then(res => res.json())
    .then(data => setEmailConfigStatus(data))
    .catch(() => setEmailConfigStatus({ configured: false, message: "Could not verify email status" }));
  }, []);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const toggleDateSelection = (dateStr: string) => {
    const newSelection = new Set(selectedDates);
    if (newSelection.has(dateStr)) {
      if (newSelection.size > 1) newSelection.delete(dateStr);
    } else {
      newSelection.add(dateStr);
    }
    setSelectedDates(newSelection);
  };

  const isTimePassed = (dateStr: string, timeStr: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;

    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    return slotTime < now;
  };

  const handleToggleSlot = (time: string, isOpening: boolean) => {
    selectedDates.forEach(date => {
      if (!isTimePassed(date, time)) {
        onUpdateAvailability(date, time, isOpening);
      }
    });
  };

  const handleQuickOpenAll = () => {
    selectedDates.forEach(date => {
      STANDARD_SLOTS.forEach(slot => {
        if (!isTimePassed(date, slot)) {
          onUpdateAvailability(date, slot, true);
        }
      });
    });
  };

  const handleSaveService = () => {
    if (editingService) {
      if (!editingService.name || !editingService.price) return;
      onUpdateServices(services.map(s => s.id === editingService.id ? editingService : s));
      setEditingService(null);
    } else {
      if (!newService.name || !newService.price || !newService.categoryId) return;
      const created: Service = {
        name: newService.name || '',
        subName: newService.subName || '',
        price: Number(newService.price) || 0,
        duration: newService.duration || '',
        description: newService.description || '',
        categoryId: newService.categoryId || categories[0]?.id,
        id: Math.random().toString(36).substr(2, 9),
      };
      onUpdateServices([...services, created]);
      setNewService({ ...newService, name: '', subName: '', price: 0, duration: '', description: '', categoryId: categories[0]?.id });
    }
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      if (!editingCategory.name) return;
      onUpdateCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
      setEditingCategory(null);
    } else {
      if (!newCategory.name) return;
      const created: Category = {
        name: newCategory.name || '',
        description: newCategory.description || '',
        id: `cat-${Math.random().toString(36).substr(2, 5)}`,
      };
      onUpdateCategories([...categories, created]);
      setNewCategory({ name: '', description: '' });
    }
  };

  // Fixed handleSuggestDescription to resolve potential "unknown to string" type error
  const handleSuggestDescription = async () => {
    // Explicitly deriving a string | undefined value and narrowing it to string
    const categoryNameCandidate: string | undefined = editingCategory ? editingCategory.name : newCategory.name;
    if (typeof categoryNameCandidate !== 'string' || !categoryNameCandidate) return;
    
    setIsAiSuggesting(true);
    try {
      const suggestion = await getCategoryDescription(categoryNameCandidate);
      if (editingCategory) {
        setEditingCategory({ ...editingCategory, description: suggestion });
      } else {
        setNewCategory({ ...newCategory, description: suggestion });
      }
    } catch (error) {
      console.error("AI Suggestion Error:", error);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-5">
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-purple-900 uppercase">Owner Dashboard <span className="font-handwriting font-normal text-purple-400 ml-2">by Jess</span></h2>
          {emailConfigStatus && (
            <div className="flex items-center mt-2 space-x-2">
              <div className={`w-2 h-2 rounded-full ${emailConfigStatus.configured ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${emailConfigStatus.configured ? 'text-green-600' : 'text-red-600'}`}>
                Email System: {emailConfigStatus.configured ? 'Live' : 'Offline (Missing Config)'}
              </span>
              {!emailConfigStatus.configured && (
                <span className="text-[8px] text-gray-400 italic font-medium">Check environment variables</span>
              )}
              {emailConfigStatus.configured && (
                <span className="text-[8px] text-green-600 italic font-medium ml-2">System is active</span>
              )}
            </div>
          )}
        </div>
        <div className="flex bg-purple-100 p-0.5 rounded-lg overflow-x-auto max-w-full no-scrollbar">
          {(['appointments', 'schedule', 'services', 'categories'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-5 py-1.5 rounded-md transition-all whitespace-nowrap text-[10px] md:text-xs font-bold uppercase tracking-widest ${activeTab === tab ? 'bg-purple-600 text-white shadow-md' : 'text-purple-700 hover:bg-purple-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'appointments' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 mb-6">
            <div className="bg-white border border-purple-100 p-5 rounded-xl shadow-sm">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Requests</p>
              <p className="text-2xl font-bold text-purple-600">{appointments.filter(a => a.status === AppointmentStatus.PENDING).length}</p>
            </div>
            <div className="bg-white border border-purple-100 p-5 rounded-xl shadow-sm">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{appointments.filter(a => a.status === AppointmentStatus.ACCEPTED).length}</p>
            </div>
            <div className="bg-white border border-purple-100 p-5 rounded-xl shadow-sm">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments
                  .filter(a => a.status === AppointmentStatus.ACCEPTED)
                  .reduce((acc, curr) => acc + (services.find(s => s.id === curr.serviceId)?.price || 0), 0)
                  .toLocaleString()} Ft
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-purple-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-100">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[9px] font-black text-purple-700 uppercase tracking-widest">Client</th>
                    <th className="px-5 py-3 text-left text-[9px] font-black text-purple-700 uppercase tracking-widest">Service</th>
                    <th className="px-5 py-3 text-left text-[9px] font-black text-purple-700 uppercase tracking-widest">Schedule</th>
                    <th className="px-5 py-3 text-left text-[9px] font-black text-purple-700 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-right text-[9px] font-black text-purple-700 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400 italic font-serif text-sm">No appointments in the system.</td>
                    </tr>
                  ) : (
                    appointments.sort((a,b) => b.createdAt - a.createdAt).map((apt) => (
                      <tr key={apt.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-900">{apt.clientName}</div>
                          <div className="text-[10px] text-gray-500">{apt.clientEmail}</div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{services.find(s => s.id === apt.serviceId)?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{apt.date}</div>
                          <div className="text-[10px] text-gray-500 font-medium">{apt.time}</div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 inline-flex text-[8px] font-black rounded-full uppercase tracking-tighter ${
                            apt.status === AppointmentStatus.ACCEPTED ? 'bg-green-100 text-green-800' :
                            apt.status === AppointmentStatus.REJECTED ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right text-xs font-medium">
                          {apt.status === AppointmentStatus.PENDING && (
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.ACCEPTED)} className="bg-green-600 text-white px-2.5 py-1 rounded-md hover:bg-green-700 transition-colors font-bold text-[10px] uppercase tracking-wide">Accept</button>
                              <button onClick={() => onUpdateAppointmentStatus(apt.id, AppointmentStatus.REJECTED)} className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md hover:bg-red-100 transition-colors font-bold text-[10px] uppercase tracking-wide">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest">Select Target Dates</h3>
              <div className="flex items-center space-x-2">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-purple-50 rounded">←</button>
                <span className="text-xs font-bold text-purple-900 min-w-[100px] text-center">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-purple-50 rounded">→</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />;
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDates.has(dateStr);
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const isPast = dateStr < new Date().toISOString().split('T')[0];
                
                return (
                  <button
                    key={dateStr}
                    disabled={isPast}
                    onClick={() => toggleDateSelection(dateStr)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all relative ${
                      isPast ? 'text-gray-200 cursor-not-allowed' :
                      isSelected ? 'bg-purple-900 text-white font-bold shadow-md' :
                      'text-purple-900 hover:bg-purple-50'
                    } ${isToday ? 'border border-purple-400' : ''}`}
                  >
                    {date.getDate()}
                    {isToday && <div className="absolute bottom-1 w-1 h-1 bg-purple-400 rounded-full"></div>}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[9px] text-gray-400 italic">Tip: Click multiple dates to batch update your availability.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest">Set Hours for Selected</h3>
              <button onClick={handleQuickOpenAll} className="text-[10px] font-bold text-purple-600 uppercase hover:underline">Open All Slots</button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STANDARD_SLOTS.map((slot) => {
                const firstDate = Array.from(selectedDates)[0];
                const dayAvail = availability.find(a => a.date === firstDate);
                const isSlotOpen = dayAvail?.slots.find(s => s.time === slot)?.isAvailable || false;
                const isPast = Array.from(selectedDates).some((d: string) => isTimePassed(d, slot));
                
                return (
                  <button
                    key={slot}
                    disabled={isPast}
                    onClick={() => handleToggleSlot(slot, !isSlotOpen)}
                    className={`p-3 border-2 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                      isPast ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' :
                      isSlotOpen 
                        ? 'border-purple-600 bg-purple-600 text-white shadow-md font-bold' 
                        : 'border-indigo-100 bg-indigo-50/50 text-indigo-400 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-[11px]">{slot}</span>
                    <span className="text-[7px] mt-1 uppercase tracking-widest">{isPast ? 'PAST' : isSlotOpen ? 'OPEN' : 'CLOSED'}</span>
                  </button>
                );
              })}
            </div>
            {selectedDates.size > 1 && (
              <div className="mt-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-[10px] font-bold text-purple-900 leading-tight">
                  BATCH UPDATE MODE: Changes will be applied to {selectedDates.size} selected dates.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm">
            <h3 className="text-lg font-bold text-purple-900 mb-4 font-serif uppercase">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Category Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-purple-100 rounded-lg text-xs bg-white text-purple-900 font-bold focus:border-purple-600 outline-none"
                  // Fixed potential "unknown to string" type error by ensuring value is always string
                  value={editingCategory ? editingCategory.name : (newCategory.name || '')}
                  onChange={(e) => editingCategory ? setEditingCategory({...editingCategory, name: e.target.value}) : setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Description</label>
                  <button onClick={handleSuggestDescription} disabled={isAiSuggesting} className="text-[8px] font-bold text-purple-600 uppercase hover:underline disabled:opacity-50">
                    {isAiSuggesting ? 'Thinking...' : '✨ Suggest with AI'}
                  </button>
                </div>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-purple-100 rounded-lg text-xs bg-white text-purple-900 font-medium focus:border-purple-600 outline-none"
                  // Fixed potential "unknown to string" type error by ensuring value is always string
                  value={editingCategory ? (editingCategory.description || '') : (newCategory.description || '')}
                  onChange={(e) => editingCategory ? setEditingCategory({...editingCategory, description: e.target.value}) : setNewCategory({...newCategory, description: e.target.value})}
                />
              </div>
            </div>
            <button onClick={handleSaveCategory} className="bg-purple-900 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">{editingCategory ? 'Apply Changes' : 'Create Category'}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex justify-between items-center group hover:border-purple-300 transition-colors">
                <div>
                  <h4 className="font-bold text-purple-900 text-sm uppercase tracking-tight">{cat.name}</h4>
                  <p className="text-[10px] text-gray-400">{services.filter(s => s.categoryId === cat.id).length} services</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCategory(cat); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] text-purple-500 font-bold uppercase hover:underline">Edit</button>
                  <button onClick={() => { if(window.confirm('Delete category?')) onUpdateCategories(categories.filter(c => c.id !== cat.id)); }} className="text-[10px] text-red-400 font-bold uppercase hover:underline">Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-5 md:p-6 rounded-xl border border-purple-100 shadow-sm" id="service-form">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-purple-900 font-serif uppercase tracking-wider">{editingService ? 'Edit Service' : 'Add Service'}</h3>
              {editingService && (
                <button 
                  type="button"
                  onClick={() => setEditingService(null)} 
                  className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-purple-600 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select 
                  className="w-full p-3 border border-purple-50 rounded-lg bg-purple-50/20 text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={editingService ? editingService.categoryId : newService.categoryId}
                  onChange={(e) => editingService ? setEditingService({...editingService, categoryId: e.target.value}) : setNewService({...newService, categoryId: e.target.value})}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/20 text-xs text-purple-900 font-bold"
                  // Fixed potential "unknown to string" type error by ensuring value is always string
                  value={editingService ? editingService.name : (newService.name || '')}
                  onChange={(e) => editingService ? setEditingService({...editingService, name: e.target.value}) : setNewService({...newService, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Detail/Sub-service</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/20 text-xs text-purple-900 font-medium"
                  // Fixed potential "unknown to string" type error by ensuring value is always string
                  value={editingService ? (editingService.subName || '') : (newService.subName || '')}
                  onChange={(e) => editingService ? setEditingService({...editingService, subName: e.target.value}) : setNewService({...newService, subName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (Ft)</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/20 text-xs text-purple-900 font-bold"
                  // Fixed potential "unknown to string" type error by ensuring value is always number
                  value={editingService ? editingService.price : (newService.price || 0)}
                  onChange={(e) => editingService ? setEditingService({...editingService, price: Number(e.target.value)}) : setNewService({...newService, price: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Duration</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/20 text-xs text-purple-900 font-medium"
                  // Fixed potential "unknown to string" type error by ensuring value is always string
                  value={editingService ? editingService.duration : (newService.duration || '')}
                  onChange={(e) => editingService ? setEditingService({...editingService, duration: e.target.value}) : setNewService({...newService, duration: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/20 text-xs text-purple-900 font-medium"
                  // Fixed potential "unknown to string" type error by ensuring value is always string
                  value={editingService ? editingService.description : (newService.description || '')}
                  onChange={(e) => editingService ? setEditingService({...editingService, description: e.target.value}) : setNewService({...newService, description: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-6">
              <button 
                type="button"
                onClick={handleSaveService}
                className="w-full md:w-auto bg-purple-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-800 shadow-md transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                {editingService ? 'Apply Changes' : 'Confirm Service'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {services.map(service => (
              <div key={service.id} className="bg-white p-4 rounded-xl border border-purple-100 flex justify-between items-start shadow-sm hover:shadow-md transition-shadow group">
                <div className="pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black uppercase text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full">{categories.find(c => c.id === service.categoryId)?.name}</span>
                    <h4 className="font-bold text-sm text-purple-900 font-serif uppercase tracking-tight">{service.name}</h4>
                  </div>
                  <p className="text-[11px] font-bold text-purple-600 mb-1.5">{service.subName ? `${service.subName} • ` : ''}{service.price.toLocaleString()} Ft • <span className="text-gray-400 font-medium">{service.duration}</span></p>
                  <p className="text-[10px] text-gray-400 italic leading-relaxed">{service.description}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingService(service);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-[9px] rounded-md hover:bg-purple-100 transition-colors uppercase tracking-widest"
                  >
                    Edit
                  </button>
                  <button 
                    type="button"
                    onClick={() => { if(window.confirm('Remove service?')) onUpdateServices(services.filter(s => s.id !== service.id)); }} 
                    className="px-3 py-1 bg-red-50 text-red-600 font-bold text-[9px] rounded-md hover:bg-red-100 transition-colors uppercase tracking-widest"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;