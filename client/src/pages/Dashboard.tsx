import React, { useEffect, useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import type { Resource, BookingFormInputs } from '../types';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { 
  Monitor, Users, Calendar, LogOut, Clock, ShieldCheck, 
  MapPin, CheckCircle, X, Eye, AlertTriangle 
} from 'lucide-react';

// --- HELPERS ---

const formatDisplayDate = (isoString: string) => {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
};

const getLocalISOString = (addHours = 0) => {
  const now = new Date();
  now.setHours(now.getHours() + addHours);
  // Adjust for timezone offset to get local time
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

// --- TYPES ---

interface SuccessModalData {
  resourceName: string;
  location: string;
  type: 'ROOM' | 'DEVICE';
  startTime: string;
  endTime: string;
}

interface ScheduleSlot {
  startTime: string;
  endTime: string;
}

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext)!;
  
  // Data State
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  
  // UI State
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalData | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{ resourceName: string; bookings: ScheduleSlot[] } | null>(null);

  // Form Setup
  const { register, handleSubmit, reset, watch } = useForm<BookingFormInputs>({
    defaultValues: {
      startTime: getLocalISOString(0),
      endTime: getLocalISOString(1),
      recurrenceType: 'NONE',
      occurrences: 1
    }
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // --- LOGIC: Calculate Duration ---
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs <= 0) return <span className="text-red-500 font-medium">Invalid Time</span>;
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return <span className="font-bold text-gray-800">{hours}h {mins > 0 ? `${mins}m` : ''}</span>;
  };

  // --- EFFECT: Load Resources ---
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data } = await axiosClient.get('/resources');
        setResources(data);
      } catch (error) { console.error("Failed to fetch resources"); }
    };
    fetchResources();
  }, []);

  // --- HANDLER: View Schedule (The "Eye" Button) ---
  const handleViewSchedule = async (e: React.MouseEvent, resource: Resource) => {
    e.stopPropagation(); // Don't select the card
    try {
      const { data } = await axiosClient.get(`/bookings/resource/${resource._id}`);
      setScheduleModal({
        resourceName: resource.name,
        bookings: data
      });
    } catch (error) {
      console.error("Could not fetch schedule");
    }
  };

  // --- HANDLER: Submit Booking ---
  const onSubmit = async (data: BookingFormInputs) => {
    setMessage(null);
    try {
      const resourceDetails = resources.find(r => r._id === selectedResource);
      if (!resourceDetails) return;

      const payload = {
        resourceId: selectedResource,
        startTime: data.startTime,
        endTime: data.endTime,
        recurrenceType: data.recurrenceType,
        occurrences: data.occurrences
      };

      await axiosClient.post('/bookings', payload);

      // Show Success Modal
      setSuccessModal({
        resourceName: resourceDetails.name,
        location: resourceDetails.location || 'Main Campus',
        type: resourceDetails.type,
        startTime: data.startTime,
        endTime: data.endTime
      });

      // Reset Form
      reset({ 
        startTime: getLocalISOString(0), 
        endTime: getLocalISOString(1),
        recurrenceType: 'NONE',
        occurrences: 1
      });
      setSelectedResource(null);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Booking failed' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      
      {/* ================= SUCCESS MODAL ================= */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-all">
            <div className="bg-green-600 p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="text-green-600 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
              <p className="text-green-100 mt-1">Your reservation has been secured.</p>
            </div>

            <div className="p-8">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
                <p className="text-green-800 text-sm font-medium text-center leading-relaxed">
                  {successModal.type === 'DEVICE' 
                    ? "Please proceed to the location below to pick up your item."
                    : "Please proceed to the location below to check in."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-0.5">
                    {successModal.type === 'DEVICE' ? <Monitor size={18} /> : <Users size={18} />}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold">Resource</div>
                    <div className="font-bold text-gray-900">{successModal.resourceName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-lg text-red-600 mt-0.5"><MapPin size={18} /></div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold">Location</div>
                    <div className="font-bold text-gray-900 text-lg">{successModal.location}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-0.5"><Clock size={18} /></div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold">Time Slot</div>
                    <div className="text-sm font-medium text-gray-800">
                      {formatDisplayDate(successModal.startTime)}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSuccessModal(null)}
                className="w-full mt-8 bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCHEDULE MODAL ================= */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-900 p-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Calendar size={18} /> Schedule: {scheduleModal.resourceName}
              </h3>
              <button onClick={() => setScheduleModal(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {scheduleModal.bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  <CheckCircle className="mx-auto w-10 h-10 text-green-500 mb-2" />
                  <p className="font-medium">This resource is completely free!</p>
                  <p className="text-xs">No upcoming future bookings found.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-200 text-center">
                    The following time slots are <strong>BUSY</strong>.
                  </p>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left rounded-l-lg">From</th>
                        <th className="px-4 py-2 text-left rounded-r-lg">To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {scheduleModal.bookings.map((b, i) => (
                        <tr key={i} className="hover:bg-red-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {new Date(b.startTime).toLocaleString('en-US', { 
                              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(b.endTime).toLocaleString('en-US', { 
                              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 border-t text-right">
              <button 
                onClick={() => setScheduleModal(null)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= NAVBAR ================= */}
      <nav className="bg-white border-b border-gray-200 px-8 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Calendar className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">UniRes<span className="text-blue-600">Portal</span></span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/my-bookings" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">History</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition">
                <ShieldCheck size={14}/> Admin Panel
              </Link>
            )}
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-800 leading-none">{user?.fullName}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{user?.role}</div>
              </div>
              <button onClick={logout} className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-gray-100">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 container mx-auto max-w-7xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Resource List */}
        <div className="lg:col-span-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Available Resources</h2>
              <p className="text-gray-500 mt-1">Select a room or device to view availability.</p>
            </div>
            <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{resources.length} items</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => (
              <div 
                key={res._id}
                onClick={() => { setSelectedResource(res._id); setMessage(null); }}
                className={clsx(
                  "relative group p-5 rounded-xl border-2 transition-all cursor-pointer",
                  selectedResource === res._id 
                    ? "border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600" 
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                )}
              >
                {/* View Schedule Button */}
                <button
                  onClick={(e) => handleViewSchedule(e, res)}
                  title="View Schedule"
                  className="absolute top-3 right-3 p-2 bg-white border border-gray-200 text-gray-500 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all z-10 shadow-sm"
                >
                  <Eye size={16} />
                </button>

                <div className="flex justify-between items-start mb-3">
                  <div className={clsx(
                    "p-2.5 rounded-lg",
                    res.type === 'ROOM' ? "bg-purple-100 text-purple-600" : "bg-indigo-100 text-indigo-600"
                  )}>
                    {res.type === 'ROOM' ? <Users size={24} /> : <Monitor size={24} />}
                  </div>
                  {selectedResource === res._id && (
                    <div className="absolute top-12 right-4 bg-blue-600 text-white rounded-full p-1">
                      <CheckCircle size={12} />
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors pr-8">{res.name}</h3>
                
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin size={14}/> {res.location}</span>
                  <span className="flex items-center gap-1">• Capacity: {res.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Booking Form */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="text-blue-600"/> Book Resource
            </h2>
            
            {!selectedResource ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 text-sm">Select an item from the list<br/>to start booking.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-xs uppercase font-bold text-blue-500 tracking-wider">Selected Item</span>
                  <div className="font-bold text-gray-900 mt-1 text-lg">
                    {resources.find(r => r._id === selectedResource)?.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Start Time</label>
                    <input 
                      type="datetime-local" 
                      {...register("startTime", { required: true })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">End Time</label>
                    <input 
                      type="datetime-local" 
                      {...register("endTime", { required: true })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Recurrence Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Repeat</label>
                    <select
                      {...register("recurrenceType")}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="NONE">No Repeat</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Times</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      {...register("occurrences", { valueAsNumber: true })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-sm text-gray-500 font-medium">Duration estimate:</span>
                  {calculateDuration()}
                </div>

                <div className="h-px bg-gray-100 my-2"></div>

                {message && (
                  <div className={clsx(
                    "p-3 rounded-lg text-sm font-medium flex items-center gap-2",
                    message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {message.type === 'error' && <AlertTriangle size={16}/>}
                    {message.text}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                >
                  Confirm Booking
                </button>
              </form>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;