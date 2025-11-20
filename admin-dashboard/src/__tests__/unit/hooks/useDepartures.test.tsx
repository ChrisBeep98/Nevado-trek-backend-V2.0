import { renderHook, waitFor, AllTheProviders } from '../../../test-utils';
import { useDepartures } from '../../../hooks/useDepartures';
import { departuresService } from '../../../services/departures.service';
import { vi, describe, it, expect } from 'vitest';

// Mock the service
vi.mock('../../../services/departures.service', () => ({
    departuresService: {
        getAll: vi.fn(),
        getCalendar: vi.fn(),
        getRange: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('useDepartures', () => {
    it('does not fetch departures when no date range provided', async () => {
        const { result } = renderHook(() => useDepartures(), { wrapper: AllTheProviders });

        // Should be disabled, so no data initially (or undefined)
        expect(result.current.data).toBeUndefined();
        expect(departuresService.getCalendar).not.toHaveBeenCalled();
    });

    it('fetches departures by range when dates provided', async () => {
        const mockDepartures = [
            { departureId: '3', date: '2023-02-01' },
        ];
        const start = '2023-02-01';
        const end = '2023-02-28';

        (departuresService.getCalendar as any).mockResolvedValue({ data: mockDepartures });

        const { result } = renderHook(() => useDepartures(start, end), { wrapper: AllTheProviders });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockDepartures);
        expect(departuresService.getCalendar).toHaveBeenCalledWith(start, end);
    });
});

