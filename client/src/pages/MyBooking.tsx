import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import type { Booking, Resource } from '../types'; // Importing shared types
import clsx from 'clsx';
import { Link } from 'react-router-dom';

// We need to extend the Booking type slightly because 'resource' is populated now
// In the DB it's an ID, but here it's an Object.
interface PopulatedBooking extends Omit<Booking, 'resource'> {
  resource: Resource;
}

const MyBookings = () => {
  const [bookings, setBookings] = useState<PopulatedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axiosClient.get('/bookings/my-bookings');
        setBookings(data);
      } catch (error) {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="p-10 text-center">Loading history...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Booking History</h1>
          <Link to="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Resource</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Time</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Return Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No bookings found. Go book something!
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{booking.resource.name}</div>
                      <div className="text-xs text-gray-500">{booking.resource.location}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="text-gray-900">{formatDate(booking.startTime)}</div>
                      <div className="text-gray-400 text-xs">to {formatDate(booking.endTime)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {booking.resource.type === 'DEVICE' ? (
                        booking.returnedAt ? (
                          <span className="text-green-600 text-sm font-bold">✓ Returned</span>
                        ) : (
                          new Date(booking.startTime) < new Date() ? (
                            <span className="text-red-600 text-sm font-bold animate-pulse">⚠ NOT RETURNED</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Wait for pickup</span>
                          )
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
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
  );
};

export default MyBookings;