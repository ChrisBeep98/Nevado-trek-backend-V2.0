import { renderHook, waitFor, AllTheProviders } from '../../../test-utils';
import { useTours } from '../../../hooks/useTours';
import { toursService } from '../../../services/tours.service';
import { vi, describe, it, expect } from 'vitest';

// Mock the service
vi.mock('../../../services/tours.service', () => ({
    toursService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('useTours', () => {
    it('fetches tours successfully', async () => {
        const mockTours = [
            { tourId: '1', name: { en: 'Tour 1', es: 'Tour 1' }, isActive: true },
            { tourId: '2', name: { en: 'Tour 2', es: 'Tour 2' }, isActive: false },
        ];

        (toursService.getAll as any).mockResolvedValue({ data: mockTours });

        const { result } = renderHook(() => useTours(), { wrapper: AllTheProviders });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockTours);
        expect(toursService.getAll).toHaveBeenCalled();
    });
});
