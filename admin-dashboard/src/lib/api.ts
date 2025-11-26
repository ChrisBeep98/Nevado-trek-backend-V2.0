import axios from 'axios';

export const API_BASE_URL = 'https://us-central1-nevadotrektest01.cloudfunctions.net/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the admin key
api.interceptors.request.use((config) => {
    const adminKey = localStorage.getItem('adminKey');
    if (adminKey) {
        config.headers['X-Admin-Secret-Key'] = adminKey;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const endpoints = {
    public: {
        tours: '/public/tours',
        departures: '/public/departures',
        joinBooking: '/public/bookings/join',
        createPrivate: '/public/bookings/private',
    },
    admin: {
        stats: '/admin/stats',
        tours: '/admin/tours', // GET, POST
        tour: (id: string) => `/admin/tours/${id}`, // GET, PUT, DELETE
        departures: '/admin/departures', // GET, POST
        departure: (id: string) => `/admin/departures/${id}`, // PUT, DELETE
        departureDate: (id: string) => `/admin/departures/${id}/date`, // PUT
        departureTour: (id: string) => `/admin/departures/${id}/tour`, // PUT
        splitDeparture: (id: string) => `/admin/departures/${id}/split`, // POST
        bookings: '/admin/bookings', // GET, POST
        joinBooking: '/admin/bookings/join', // POST - Join existing departure
        booking: (id: string) => `/admin/bookings/${id}`, // GET, PUT, DELETE
        bookingStatus: (id: string) => `/admin/bookings/${id}/status`, // PUT
        bookingPax: (id: string) => `/admin/bookings/${id}/pax`, // PUT
        bookingDetails: (id: string) => `/admin/bookings/${id}/details`, // PUT
        convertBooking: (id: string) => `/admin/bookings/${id}/convert-type`, // POST
        moveBooking: (id: string) => `/admin/bookings/${id}/move`, // POST
        applyDiscount: (id: string) => `/admin/bookings/${id}/discount`, // POST
    }
};
