import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import type { Booking, Resource, User } from '../types';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, RefreshCw, User as UserIcon, BarChart3, PieChart } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area 
} from 'recharts';
import clsx from 'clsx';

interface AdminBooking extends Omit<Booking, 'resource' | 'user'> {
  resource: Resource;
  user: User;
}

interface ResourceStat {
  name: string;
  bookings: number;
}

interface UserStat {
  name: string;
  bookings: number;
  hours: number;
}

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [resourceStats, setResourceStats] = useState<ResourceStat[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch 3 APIs in parallel
      const [bookingsRes, resStatsRes, userStatsRes] = await Promise.all([
        axiosClient.get('/bookings/all'),
        axiosClient.get('/bookings/stats'),
        axiosClient.get('/bookings/user-stats')
      ]);

      setBookings(bookingsRes.data);
      setResourceStats(resStatsRes.data);
      setUserStats(userStatsRes.data);
    } catch (error) {
      console.error("Admin Access Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReturnItem = async (bookingId: string) => {
    if(!confirm("Confirm item return?")) return;
    try {
      await axiosClient.put(`/bookings/${bookingId}/return`);
      fetchData(); 
    } catch (error: any) {
      alert(error.response?.data?.message);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">
      <RefreshCw className="animate-spin mr-2" /> Loading Analytics...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
            <p className="text-gray-500 mt-1">Analytics & Management Dashboard.</p>
          </div>
          <Link to="/dashboard" className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
        </div>

        {/* --- ANALYTICS SECTION (GRID LAYOUT) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* CHART 1: RESOURCE UTILIZATION */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Most Popular Resources</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="bookings" name="Total Bookings" radius={[4, 4, 0, 0]} barSize={40}>
                    {resourceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563EB' : '#60A5FA'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: TOP USERS BY TIME (HOURS) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Top Users (by Duration)</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="hours" name="Total Hours" stroke="#8884d8" fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
        {/* --- END ANALYTICS SECTION --- */}

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[25%] px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                  <th className="w-[20%] px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="w-[20%] min-w-[200px] px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Slot</th>
                  <th className="w-[15%] min-w-[160px] px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="w-[20%] min-w-[160px] px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <UserIcon size={16} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{booking.user.fullName}</div>
                          <div className="text-sm text-gray-500">{booking.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{booking.resource.name}</div>
                      <span className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1",
                        booking.resource.type === 'ROOM' ? "bg-purple-100 text-purple-800" : "bg-indigo-100 text-indigo-800"
                      )}>
                        {booking.resource.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Clock size={14} className="mr-1.5 text-gray-400"/> 
                        {formatDate(booking.startTime)}
                      </div>
                      <div className="text-xs text-gray-500 pl-5 mt-1">to {formatDate(booking.endTime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.resource.type === 'DEVICE' ? (
                          booking.returnedAt ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle size={12} className="mr-1" /> Returned
                              </span>
                          ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle size={12} className="mr-1" /> Pending Return
                              </span>
                          )
                      ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Auto-Expire</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {booking.resource.type === 'DEVICE' && !booking.returnedAt && (
                        <button 
                          onClick={() => handleReturnItem(booking._id)}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
                        >
                          Confirm Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;