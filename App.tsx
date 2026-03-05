
import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus, DailyAvailability, Service, Category } from './types';
import { INITIAL_SERVICES, INITIAL_CATEGORIES, STANDARD_SLOTS } from './constants';
import AdminDashboard from './components/AdminDashboard';
import AIHairAssistant from './components/AIHairAssistant';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

const App: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('hgs_auth_token'));
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  const [view, setView] = useState<'home' | 'services'>('home');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<DailyAvailability[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [showNotification, setShowNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  
  const HERO_BG_IMAGE = "https://raw.githubusercontent.com/Ambrose1710/Project-Image-bank/main/Hair%20gallery%20logo.jpeg";

  useEffect(() => {
    const storedApts = localStorage.getItem('hgs_appointments');
    const storedAvail = localStorage.getItem('hgs_availability');
    const storedServices = localStorage.getItem('hgs_services');
    const storedCats = localStorage.getItem('hgs_categories');
    if (storedApts) setAppointments(JSON.parse(storedApts));
    if (storedAvail) setAvailability(JSON.parse(storedAvail));
    if (storedServices) setServices(JSON.parse(storedServices));
    if (storedCats) setCategories(JSON.parse(storedCats));
  }, []);

  useEffect(() => {
    localStorage.setItem('hgs_appointments', JSON.stringify(appointments));
    localStorage.setItem('hgs_availability', JSON.stringify(availability));
    localStorage.setItem('hgs_services', JSON.stringify(services));
    localStorage.setItem('hgs_categories', JSON.stringify(categories));
  }, [appointments, availability, services, categories]);

  const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 5000);
  };

  const handleBookAppointment = () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientInfo.name || !clientInfo.email) return;

    const newApt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      serviceId: selectedService.id,
      date: selectedDate,
      time: selectedTime,
      status: AppointmentStatus.PENDING,
      createdAt: Date.now()
    };

    setAppointments(prev => [...prev, newApt]);
    
    // Notify server to send emails
    fetch('/api/bookings/notify-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime
      })
    }).catch(err => console.error("Failed to notify server about booking request:", err));

    triggerNotification(`Request Sent! A confirmation email has been dispatched to ${clientInfo.email}. The owner has also been notified.`, 'success');
    
    setBookingStep(1);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setClientInfo({ name: '', email: '', phone: '' });
    setView('home');
  };

  const startBooking = (service: Service) => {
    setSelectedService(service);
    setBookingStep(2); // Jump to date selection
    const el = document.getElementById('book');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        const msg = status === AppointmentStatus.ACCEPTED 
          ? `Appointment Accepted. Added to your calendar and confirmation email sent to ${a.clientName}.` 
          : `Appointment rejected. Client has been notified.`;
        
        // Notify server to send status update email
        const service = services.find(s => s.id === a.serviceId);
        fetch('/api/bookings/notify-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: a.clientName,
            clientEmail: a.clientEmail,
            serviceName: service?.name || "Service",
            date: a.date,
            time: a.time,
            status: status
          })
        }).catch(err => console.error("Failed to notify server about status update:", err));

        triggerNotification(msg, status === AppointmentStatus.ACCEPTED ? 'success' : 'info');
        return { ...a, status };
      }
      return a;
    }));
  };

  const updateAvailability = (date: string, time: string, isAvailable: boolean) => {
    setAvailability(prev => {
      const dayIndex = prev.findIndex(d => d.date === date);
      if (dayIndex >= 0) {
        const newSlots = prev[dayIndex].slots.map(s => s.time === time ? { ...s, isAvailable } : s);
        const newState = [...prev];
        newState[dayIndex] = { ...prev[dayIndex], slots: newSlots };
        return newState;
      } else {
        const newDay: DailyAvailability = {
          date,
          slots: STANDARD_SLOTS.map(t => ({ id: t, time: t, isAvailable: t === time ? isAvailable : false }))
        };
        return [...prev, newDay];
      }
    });
  };

  const handleUpdateServices = (newServices: Service[]) => {
    setServices(newServices);
    triggerNotification("Collection updated successfully.", "success");
  };

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    triggerNotification("Categories updated successfully.", "success");
  };

  const handleLogin = (token: string) => {
    setAuthToken(token);
    localStorage.setItem('hgs_auth_token', token);
    triggerNotification("Welcome back, Admin!", "success");
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('hgs_auth_token');
    setIsAdminMode(false);
    triggerNotification("Logged out successfully.", "info");
  };

  const getAvailableSlots = (date: string) => {
    const dayAvail = availability.find(a => a.date === date);
    if (!dayAvail) return [];
    return dayAvail.slots.filter(s => s.isAvailable);
  };

  const availableDates = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return availability
      .filter(d => d.date >= today && d.slots.some(s => s.isAvailable))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => d.date);
  }, [availability]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      num: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' })
    };
  };

  const nextStep = () => setBookingStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setBookingStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#FDF6E3]/20 selection:bg-purple-200">
      <nav className="fixed top-0 left-0 w-full z-50 bg-purple-900 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer" onClick={() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 overflow-hidden">
              <img src={HERO_BG_IMAGE} alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold tracking-tight text-white font-serif leading-none uppercase">THE HAIR GALLERY</h1>
              <p className="text-[7px] md:text-[8px] uppercase tracking-widest text-purple-200 mt-1 font-handwriting">by Jess</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 md:space-x-6">
            <button 
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[10px] md:text-xs font-semibold text-purple-100 hover:text-white transition-colors uppercase tracking-widest"
            >
              {isAdminMode ? 'Client Portal' : 'Admin Login'}
            </button>
            {!isAdminMode && (
              <button onClick={() => setView('services')} className="hidden sm:block bg-white text-purple-900 px-4 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold hover:bg-purple-50 transition-all shadow-lg">
                View Services
              </button>
            )}
          </div>
        </div>
      </nav>

      {showNotification && (
        <div className={`fixed top-24 right-4 z-[60] p-5 max-w-sm rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-l-4 flex items-start space-x-4 transition-all animate-in slide-in-from-right-10 bg-white ${
          showNotification.type === 'success' ? 'border-green-500' : 'border-purple-500'
        }`}>
          <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${showNotification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
            {showNotification.type === 'success' ? '✓' : 'ℹ'}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 mb-0.5 uppercase tracking-wide">{showNotification.type === 'success' ? 'Success' : 'Notice'}</p>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">{showNotification.message}</p>
          </div>
        </div>
      )}

      {isAdminMode ? (
        <div className="pt-24 pb-12">
          {!authToken ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {authView === 'login' && (
                <Login 
                  onLogin={handleLogin} 
                  onForgotPassword={() => setAuthView('forgot')} 
                />
              )}
              {authView === 'forgot' && (
                <ForgotPassword 
                  onBack={() => setAuthView('login')} 
                  onTokenGenerated={(token) => {
                    setResetToken(token);
                    setAuthView('reset');
                  }}
                />
              )}
              {authView === 'reset' && resetToken && (
                <ResetPassword 
                  token={resetToken} 
                  onSuccess={() => {
                    setAuthView('login');
                    setResetToken(null);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="max-w-7xl mx-auto px-4 mb-6 flex justify-end">
                <button 
                  onClick={handleLogout}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
                >
                  Logout
                </button>
              </div>
              <AdminDashboard 
                appointments={appointments} 
                availability={availability}
                services={services}
                categories={categories}
                onUpdateAppointmentStatus={updateAppointmentStatus}
                onUpdateAvailability={updateAvailability}
                onUpdateServices={handleUpdateServices}
                onUpdateCategories={handleUpdateCategories}
              />
            </div>
          )}
        </div>
      ) : (
        <main className="pt-20">
          {view === 'home' && (
            <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#FDF6E3] overflow-hidden border-b border-purple-100">
              <div className="absolute inset-0 z-0">
                <img 
                  src={HERO_BG_IMAGE} 
                  alt="background" 
                  className="w-full h-full object-cover opacity-20 object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FDF6E3]/40 via-transparent to-[#FDF6E3]/60"></div>
              </div>
              <div className="relative z-10 text-center px-4 md:px-6 max-w-5xl flex flex-col items-center">
                <div className="bg-white/70 backdrop-blur-md p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/50 shadow-2xl animate-in zoom-in duration-700 w-full max-w-xl">
                  <img 
                    src={HERO_BG_IMAGE} 
                    alt="logo" 
                    className="w-full max-w-[180px] md:max-w-xs h-auto drop-shadow-xl mb-4 md:mb-6 mx-auto rounded-xl"
                  />
                  <div className="mt-1 md:mt-2">
                    <p className="text-purple-900 text-2xl md:text-5xl font-handwriting font-bold italic tracking-tight leading-tight">
                      ...because hair is art
                    </p>
                    <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <button 
                        onClick={() => { setView('services'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                        className="w-full sm:w-auto bg-purple-900 text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:bg-purple-800 transition-all shadow-xl hover:scale-105 active:scale-95 text-center"
                      >
                        View Services
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === 'home' && (
            <section className="py-12 md:py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12 md:mb-16">
                  <h2 className="text-3xl md:text-5xl font-bold text-purple-900 mb-4 font-serif">Personalized Hair Care</h2>
                  <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
                    Not sure how to maintain your new look? Our AI-powered assistant provides expert advice tailored to your hairstyle and hair type.
                  </p>
                </div>
                <AIHairAssistant />
              </div>
            </section>
          )}

          {view === 'services' && (
            <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 animate-in fade-in duration-500">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold text-purple-900 mb-4 font-serif">General Services & Products</h2>
                <button onClick={() => setView('home')} className="text-purple-500 font-bold uppercase tracking-widest text-[10px] hover:text-purple-700">← Back to Home</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white rounded-3xl p-6 md:p-8 border border-purple-100 shadow-xl hover:shadow-2xl transition-all">
                    <h3 className="text-xl md:text-2xl font-bold text-purple-900 mb-1 font-serif uppercase tracking-tight">{cat.name}</h3>
                    <p className="text-lg md:text-xl text-purple-800/80 mb-6 font-handwriting leading-snug">{cat.description}</p>
                    
                    <div className="space-y-4">
                      {services.filter(s => s.categoryId === cat.id).length === 0 ? (
                        <p className="text-gray-400 italic text-xs">No services listed in this category.</p>
                      ) : (
                        services.filter(s => s.categoryId === cat.id).map(service => (
                          <div key={service.id} className="flex flex-col border-b border-purple-50 pb-4 last:border-0">
                            <div className="flex justify-between items-center mb-1">
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm md:text-base">{service.name}</h4>
                                {service.subName && (
                                  <p className="text-[10px] uppercase font-black tracking-widest text-purple-400">{service.subName}</p>
                                )}
                              </div>
                              <span className="font-black text-purple-900 text-sm md:text-lg">{service.price.toLocaleString()} Ft</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{service.description}</p>
                            <button 
                              onClick={() => startBooking(service)}
                              className="w-full bg-purple-50 text-purple-900 font-bold py-2 rounded-xl text-xs hover:bg-purple-900 hover:text-white transition-all shadow-sm"
                            >
                              Book Now
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="book" className={`py-12 md:py-20 bg-[#FDF6E3]/10 ${selectedService ? 'block' : 'hidden'}`}>
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold text-purple-900 mb-3 font-serif">Secure Your Session</h2>
              </div>

              <div className="bg-white border border-purple-100 rounded-[1.2rem] md:rounded-[2rem] shadow-2xl overflow-hidden">
                <div className="flex bg-purple-50 overflow-x-auto no-scrollbar">
                  {[2, 3, 4].map(step => (
                    <div key={step} className={`flex-1 text-center py-3 md:py-4 text-[7px] md:text-[9px] font-black tracking-[0.12em] md:tracking-[0.15em] uppercase transition-all min-w-[120px] ${bookingStep >= step ? 'text-purple-900' : 'text-gray-300'}`}>
                      {step === 2 ? 'Step 1: Pick Date' : step === 3 ? 'Step 2: Pick Time' : 'Step 3: Contact Details'}
                    </div>
                  ))}
                </div>

                <div className="p-5 md:p-12">
                  {bookingStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-lg md:text-xl font-bold text-purple-900 font-serif">Choose an available date</h4>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                          {selectedService?.name}
                        </span>
                      </div>
                      
                      {availableDates.length > 0 ? (
                        <div className="flex space-x-3 overflow-x-auto pb-6 no-scrollbar snap-x">
                          {availableDates.map(dateStr => {
                            const { day, num, month } = formatDateLabel(dateStr);
                            const isSelected = selectedDate === dateStr;
                            return (
                              <button
                                key={dateStr}
                                onClick={() => {
                                  setSelectedDate(dateStr);
                                  setSelectedTime('');
                                }}
                                className={`flex-shrink-0 w-20 md:w-24 py-4 md:py-6 rounded-2xl border-2 transition-all snap-start flex flex-col items-center justify-center space-y-1 md:space-y-2 ${
                                  isSelected 
                                    ? 'bg-purple-900 border-purple-900 text-white shadow-xl scale-105' 
                                    : 'bg-white border-purple-100 text-purple-900 hover:border-purple-300'
                                }`}
                              >
                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-purple-200' : 'text-purple-400'}`}>{month}</span>
                                <span className="text-xl md:text-2xl font-black font-serif">{num}</span>
                                <span className={`text-[9px] md:text-[10px] font-bold uppercase ${isSelected ? 'text-purple-100' : 'text-gray-500'}`}>{day}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 text-center bg-purple-50 rounded-3xl border border-dashed border-purple-200">
                          <p className="text-purple-900 font-serif text-lg italic mb-2">No dates available yet</p>
                          <p className="text-xs text-purple-400 font-medium">Please check back later or contact Jess directly.</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 md:pt-4">
                        <button onClick={() => { setSelectedService(null); setView('services'); }} className="text-purple-900 font-black tracking-widest uppercase text-[8px] hover:underline">Cancel</button>
                        <button onClick={nextStep} disabled={!selectedDate} className="bg-purple-900 text-white px-8 md:px-12 py-2 md:py-3.5 rounded-full font-bold shadow-xl disabled:opacity-50 text-xs md:text-sm transition-all">Next: Pick Time</button>
                      </div>
                    </div>
                  )}

                  {bookingStep === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg md:text-xl font-bold text-purple-900 font-serif">Select your preferred time</h4>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Choosen Date</p>
                          <p className="text-xs font-bold text-purple-900">{new Date(selectedDate).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                        {getAvailableSlots(selectedDate).map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`group relative overflow-hidden py-4 border-2 rounded-2xl font-black text-xs md:text-sm transition-all flex flex-col items-center justify-center space-y-1 ${
                              selectedTime === slot.time ? 'bg-purple-900 border-purple-900 text-white shadow-xl scale-105' : 
                              'bg-white border-purple-50 text-purple-900 hover:border-purple-400'
                            }`}
                          >
                            <span>{slot.time}</span>
                            <span className={`text-[7px] uppercase tracking-tighter ${selectedTime === slot.time ? 'text-purple-200' : 'text-purple-400 group-hover:text-purple-600'}`}>Available</span>
                          </button>
                        ))}
                      </div>

                      {getAvailableSlots(selectedDate).length === 0 && (
                        <div className="py-12 text-center bg-purple-50 rounded-3xl border border-dashed border-purple-200">
                          <p className="text-purple-900 font-serif text-lg italic">All slots taken for this day</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 md:pt-4">
                        <button onClick={prevStep} className="text-purple-900 font-black tracking-widest uppercase text-[8px] hover:underline">Back to Dates</button>
                        <button onClick={nextStep} disabled={!selectedTime} className="bg-purple-900 text-white px-8 md:px-12 py-2 md:py-3.5 rounded-full font-bold shadow-xl disabled:opacity-50 text-xs md:text-sm transition-all">Next: Finalize</button>
                      </div>
                    </div>
                  )}

                  {bookingStep === 4 && (
                    <div className="space-y-5 md:space-y-6 animate-in fade-in duration-300">
                      <h4 className="text-lg md:text-xl font-bold text-purple-900 font-serif">Booking Information</h4>
                      <div className="grid grid-cols-1 gap-3 md:gap-4">
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          className="w-full p-4 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/10 text-xs md:text-sm font-medium"
                          value={clientInfo.name}
                          onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                        />
                        <input 
                          type="email" 
                          placeholder="Email Address" 
                          className="w-full p-4 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/10 text-xs md:text-sm font-medium"
                          value={clientInfo.email}
                          onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone Number" 
                          className="w-full p-4 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50/10 text-xs md:text-sm font-medium"
                          value={clientInfo.phone}
                          onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                        />
                      </div>
                      <div className="bg-purple-900 p-5 md:p-8 rounded-[1.2rem] md:rounded-[2rem] text-white shadow-2xl relative overflow-hidden mt-4 md:mt-6 border border-white/10">
                        <img src={HERO_BG_IMAGE} className="absolute right-0 bottom-0 w-20 md:w-28 h-20 md:h-28 opacity-10 grayscale brightness-200" alt="watermark" />
                        <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-purple-300 mb-1 md:mb-2">Selected Experience</p>
                        <p className="text-lg md:text-2xl font-serif font-bold italic mb-0.5 md:mb-1">{selectedService?.name}</p>
                        {selectedService?.subName && <p className="text-[9px] uppercase tracking-tighter text-purple-200 mb-2">{selectedService.subName}</p>}
                        <p className="text-purple-100 text-xs md:text-sm font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { dateStyle: 'full' })} • {selectedTime}</p>
                        <div className="flex items-center justify-between mt-4 md:mt-6">
                            <p className="text-xl md:text-3xl font-black">{selectedService?.price.toLocaleString()} Ft</p>
                            <span className="text-[8px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Pending Approval</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 md:pt-4">
                        <button onClick={prevStep} className="text-purple-900 font-black tracking-widest uppercase text-[8px] hover:underline">Back</button>
                        <button 
                          onClick={handleBookAppointment} 
                          disabled={!clientInfo.name || !clientInfo.email} 
                          className="bg-purple-900 text-white px-8 md:px-12 py-2.5 md:py-3.5 rounded-full font-bold shadow-2xl disabled:opacity-50 text-xs md:text-base transition-all hover:bg-purple-800"
                        >
                          Request Appointment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <footer className="bg-purple-950 text-white py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <div className="flex flex-col items-center mb-6 md:mb-8">
                <img src={HERO_BG_IMAGE} alt="logo" className="h-24 md:h-32 w-auto mb-4 grayscale brightness-200 rounded-lg" />
                <div className="font-serif text-xl md:text-2xl font-bold tracking-tight uppercase">The Hair Gallery</div>
                <div className="text-purple-400 font-black text-[7px] md:text-[8px] uppercase tracking-[0.4em] mt-2 font-handwriting">Professional Care by Jess</div>
              </div>
              <p className="text-purple-200/60 max-sm mx-auto mb-8 text-xs md:text-sm leading-relaxed font-medium">
                Exclusive hair artistry tailored for your unique identity.
              </p>
              <div className="flex justify-center space-x-6 md:space-x-10 mb-8 md:mb-12">
                <a href="https://www.instagram.com/thehairgallery_thg/" target="_blank" rel="noopener noreferrer" className="text-purple-200 hover:text-white transition-colors uppercase text-[7px] md:text-[8px] font-black tracking-widest">Instagram</a>
              </div>
              <div className="pt-6 md:pt-8 border-t border-white/5 text-[7px] md:text-[8px] text-purple-400 font-black tracking-widest uppercase">
                © 2026 The Hair Gallery. All rights reserved.
              </div>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
};

export default App;
