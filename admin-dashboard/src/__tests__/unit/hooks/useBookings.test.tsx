import { renderHook, waitFor, AllTheProviders } from '../../../test-utils';
import { useBookings } from '../../../hooks/useBookings';
import { bookingsService } from '../../../services/bookings.service';
import { vi, describe, it, expect } from 'vitest';

// Mock the service
vi.mock('../../../services/bookings.service', () => ({
    bookingsService: {
        getAll: vi.fn(),
        getByDeparture: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('useBookings', () => {
    it('fetches all bookings successfully', async () => {
        const mockBookings = [
            { bookingId: '1', customerName: 'John Doe', status: 'confirmed' },
            { bookingId: '2', customerName: 'Jane Doe', status: 'pending' },
        ];

        (bookingsService.getAll as any).mockResolvedValue({ data: mockBookings });

        const { result } = renderHook(() => useBookings(), { wrapper: AllTheProviders });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockBookings);
        expect(bookingsService.getAll).toHaveBeenCalled();
    });

    it('fetches bookings by departure successfully', async () => {
        const mockBookings = [
            { bookingId: '3', customerName: 'Bob Smith', departureId: 'dep1' },
        ];

        (bookingsService.getByDeparture as any).mockResolvedValue({ data: mockBookings });

        const { result } = renderHook(() => useBookings('dep1'), { wrapper: AllTheProviders });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockBookings);
        expect(bookingsService.getByDeparture).toHaveBeenCalledWith('dep1');
    });
});
