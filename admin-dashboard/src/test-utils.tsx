import { cleanup, render } from '@testing-library/react';
import { afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { type ReactElement } from 'react';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

function AllTheProviders({ children }: { children: React.ReactNode }) {
    const testQueryClient = createTestQueryClient();
    return (
        <QueryClientProvider client={testQueryClient}>
            <AuthProvider>
                <BrowserRouter>
                    {children}
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}

function customRender(ui: ReactElement, options = {}) {
    return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
export { AllTheProviders };

