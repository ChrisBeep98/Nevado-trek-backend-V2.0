# Frontend - Component Structure & User Flows

**Version**: v2.0  
**Last Updated**: November 25, 2025  
**Framework**: React 18 + TypeScript + Vite

---

## 📚 TABLA DE CONTENIDOS

1. [Component Hierarchy](#component-hierarchy)
2. [State Management Patterns](#state-management)
3. [User Flows Detallados](#user-flows)
4. [Component APIs](#component-apis)
5. [Hooks Usage Guide](#hooks-guide)
6. [Common Patterns](#common-patterns)

---

## 🎯 COMPONENT HIERARCHY

### Application Structure

```
App
├── AuthProvider (Context)
│   └── ToastProvider (Context)
│       ├── Login Page
│       └── MainLayout
│           ├── Navbar
│           ├── Sidebar
│           └── Routes
│               ├── Home (Calendar)
│               │   ├── MonthSelector
│               │   ├── DepartureCard []
│               │   └── DepartureModal
│               │       ├── Tabs.Root
│               │       ├── Tab: Overview
│               │       ├── Tab: Bookings
│               │       │   ├── BookingRow []
│               │       │   ├── + Add Booking Button
│               │       │   └── BookingModal
│               │       └── Tab: Tools
│               │           ├── Convert to Public
│               │           ├── Update Date
│               │           └── Update Tour
│               │
│               ├── Tours Page
│               │   ├── TourCard []
│               │   ├── + New Tour Button
│               │   └── TourModal
│               │       ├── Tab: Basic Info
│               │       │   ├── NameInput (ES/EN)
│               │       │   ├── DescriptionInput (ES/EN)
│               │       │   ├── DurationInput
│               │       │   └── DifficultySelect
│               │       ├── Tab: Itinerary
│               │       │   └── ItineraryDay []
│               │       │       ├── DayNumber
│               │       │       ├── Title (ES/EN)
│               │       │       └── Activities (ES/EN)
│               │       ├── Tab: Pricing
│               │       │   └── PricingTier []
│               │       │       ├── minPax
│               │       │       ├── maxPax
│               │       │       └── pricePerPerson
│               │       └── Tab: Images
│               │           ├── MainImage
│               │           └── Gallery []
│               │
│               ├── Bookings Page
│               │   ├── FilterBar
│               │   ├── BookingCard []
│               │   └── BookingModal
│               │       ├── Tab: Details
│               │       │   ├── CustomerForm
│               │       │   ├── PaxInput
│               │       │   └── DepartureInfo
│               │       ├── Tab: Status & Type
│               │       │   ├── StatusSelect
│               │       │   └── TypeBadge
│               │       ├── Tab: Actions
│               │       │   ├── ApplyDiscount
│               │       │   ├── UpdateDate
│               │       │   └── UpdateTour
│               │       └── Tab: Transfer ⭐ NEW
│               │           ├── JoinPublic (if private)
│               │           └── MoveToAnother (if public)
│               │
│               └── Stats Page
│                   ├── StatCard []
│                   ├── RevenueChart
│                   └── BookingsChart
```

---

## 🔄 STATE MANAGEMENT

### 1. Server State (React Query)

**Pattern**: Hooks encapsulate React Query

```typescript
// hooks/useBookings.ts
export function useBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => bookingsService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBookingMutations() {
  const queryClient = useQueryClient();
  
  const createBooking = useMutation({
    mutationFn: bookingsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['departures']);
      success('Booking created');
    },
  });
  
  // ... more mutations
  
  return { createBooking, updateStatus, ... };
}
```

**Usage in Components**:
```typescript
function BookingsPage() {
  const { data: bookings, isLoading } = useBookings();
  const { createBooking } = useBookingMutations();
  
  const handleCreate = (data) => {
    createBooking.mutate(data);
  };
  
  // ...
}
```

### 2. Client State (React State + Context)

**Pattern**: Context for global UI state

```typescript
// context/AuthContext.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [adminKey, setAdminKey] = useState<string | null>(
    localStorage.getItem('adminKey')
  );
  
  const login = (key: string) => {
    localStorage.setItem('adminKey', key);
    setAdminKey(key);
  };
  
  const logout = () => {
    localStorage.removeItem('adminKey');
    setAdminKey(null);
  };
  
  return (
    <AuthContext.Provider value={{ adminKey, login, logout, isAuthenticated: !!adminKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};
```

### 3. Form State (React Hook Form)

**Pattern**: Zod schema validation

```typescript
// In BookingModal.tsx
const customerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone required'),
  document: z.string().min(1, 'Document required'),
  note: z.string().optional(),
});

const bookingSchema = z.object({
  customer: customerSchema,
  pax: z.number().min(1, 'Min 1 pax'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

function BookingModal() {
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { pax: 1, customer: { name: '', email: '', phone: '', document: '' } }
  });
  
  const onSubmit = (data: BookingFormValues) => {
    // Submit logic
  };
  
  // ...
}
```

---

## 👤 USER FLOWS DETALLADOS

### Flow 1: Login

```
User Journey:
1. User lands on /login
2. Sees glass morphism login form
3. Enters admin key
4. Clicks "Login"

Component Flow:
Login.tsx
  → useAuth().login(key)
    → localStorage.setItem('adminKey', key)
    → setAdminKey(key)
    → navigate('/')

API Call:
None (client-side validation only)
Admin key sent on subsequent API calls via axios interceptor
```

### Flow 2: Ver Calendar y Abrir Departure

```
User Journey:
1. User on Home (/)
2. Sees calendar with departure cards
3. Clicks on a departure card

Component Flow:
Home.tsx
  ├── useDepartures() → GET /admin/departures
  ├── Renders DepartureCard with onClick
  └── DepartureCard clicked
      └── setSelectedDepartureId(id)
          └── Opens DepartureModal

DepartureModal
  ├── useDeparture(id) → GET /admin/departures/:id
  ├── useBookings({ departureId }) → GET /admin/bookings?departureId=xxx
  └── Renders 3 tabs: Overview, Bookings, Tools

State Management:
- Server state: departures, single departure, bookings
- Client state: selectedDepartureId, active tab
```

### Flow 3: Crear Booking (Join Existing Departure)

```
User Journey:
1. User in DepartureModal → Bookings tab
2. Clicks "+ Add Booking"
3. BookingModal opens with departureId prop
4. Fills customer info + pax
5. Clicks "Create Booking"

Component Flow:
DepartureModal (Bookings Tab)
  → Click "+ Add Booking"
    → setBookingModalOpen(true)
    → Pass departureId as prop

BookingModal
  ├── Props: { departureId: "dep_xyz789" }
  ├── useDeparture(departureId) → Fetch departure info
  ├── Form auto-populated with departure data
  └── onSubmit
      ├── Validate capacity: currentPax + pax <= maxPax
      ├── Construct payload: { departureId, customer, pax, date, type: 'public' }
      └── createBooking.mutate(payload)

API Call:
POST /admin/bookings/join
Body: { departureId, customer, pax }

Backend Logic:
1. Validate capacity
2. Get tour pricing
3. Create booking with type="public"
4. Update departure.currentPax
5. Return booking

Frontend Update:
- React Query invalidates ['bookings'] and ['departures']
- UI re-fetches automatically
- Toast success message
- Modal closes
```

### Flow 4: Transfer Booking (Private → Join Public)

```
User Journey:
1. User selects PRIVATE booking
2. Opens BookingModal → Transfer tab
3. Sees "Join Public Departure" section
4. Selects target public departure from dropdown
5. Clicks "Join Public Departure"
6. Confirms warning dialog
7. System converts to public + moves

Component Flow:
BookingModal (Transfer Tab)
  ├── isPrivateBooking = booking.type === 'private'
  ├── availableDepartures query → GET /admin/departures (filtered)
  │   Filters: same tour, public, open, future
  ├── Dropdown populated with options
  └── handleJoinPublicDeparture()
      ├── Validate capacity
      ├── Show confirm dialog
      └── Execute sequential:
          1. convertType.mutate({ id, targetType: 'public' })
             → POST /admin/bookings/:id/convert-type
          2. onSuccess → moveBooking.mutate({ id, newTourId, newDate })
             → POST /admin/bookings/:id/move

API Calls:
1. POST /admin/bookings/:id/convert-type
   Body: { targetType: "public" }
   
2. POST /admin/bookings/:id/move
   Body: { newTourId, newDate }

Result:
- Booking type changed to public
- Booking moved to target departure
- Old departure deleted (if empty)
- Success toast
```

### Flow 5: Cancel Booking (with Irreversible Warning)

```
User Journey:
1. User in BookingModal → Status & Type tab
2. Changes status dropdown to "Cancelled"
3. Warning dialog appears:
   "⚠️ WARNING: Cancellation is IRREVERSIBLE"
4. User confirms or cancels

Component Flow:
BookingModal (Status & Type Tab)
  └── StatusSelect onChange
      └── handleStatusChange('cancelled')
          ├── Show confirm dialog
          │   "Once cancelled, this booking cannot be reactivated"
          ├── User confirms
          └── updateStatus.mutate({ id, status: 'cancelled' })

API Call:
PUT /admin/bookings/:id/status
Body: { status: "cancelled" }

Backend Logic:
if (type === 'private') {
  - Set booking.status = 'cancelled'
  - Set departure.status = 'cancelled'
}
else if (type === 'public') {
  - Set booking.status = 'cancelled'
  - departure.currentPax -= booking.pax
  - if (currentPax === 0) delete departure
}

Frontend Update:
- Booking status updated
- Departure currentPax updated
- If departure deleted, removed from list
```

---

## 📦 COMPONENT APIs

### DepartureModal

**Props**:
```typescript
interface DepartureModalProps {
  isOpen: boolean;
  onClose: () => void;
  departureId?: string;
}
```

**Internal State**:
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'tools'>('overview');
const [bookingModalOpen, setBookingModalOpen] = useState(false);
const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
```

**Queries**:
```typescript
const { data: departure } = useDeparture(departureId);
const { data: bookings } = useBookings({ departureId });
const { data: tour } = useTour(departure?.tourId);
```

**Mutations**:
```typescript
const { convertToPublic, updateDate, updateTour, deleteDeparture } = useDepartureMutations();
```

---

### BookingModal

**Props**:
```typescript
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;        // Edit mode
  departureId?: string;      // Create mode (join existing)
}
```

**Modes**:
```typescript
const mode = bookingId ? 'edit' : 'create';
const isJoining = !bookingId && !!departureId;
```

**Form State**:
```typescript
const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingFormValues>({
  resolver: zodResolver(bookingSchema),
});
```

**Queries**:
```typescript
const { data: booking } = useBooking(bookingId);
const { data: departure } = useDeparture(departureId || booking?.departureId);
const { data: tour } = useTour(departure?.tourId);
const { data: relatedBookings } = useBookings({ 
  departureId: booking?.departureId 
}, { enabled: departure?.type === 'public' });
const { data: availableDepartures } = useQuery(['departures', 'transfer', tour?.tourId], ...);
```

**Mutations**:
```typescript
const {
  createBooking,
  updateDetails,
  updatePax,
  updateStatus,
  applyDiscount,
  convertType,
  moveBooking
} = useBookingMutations();
```

**Tabs**:
1. **Details**: Customer form, pax input
2. **Status & Type**: Status select, type badge, cancellation warning
3. **Actions**: Discount, update date/tour (private only)
4. **Transfer**: Join public (private) or move to another (public)

---

### TourModal

**Props**:
```typescript
interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId?: string;
}
```

**Form Structure**:
```typescript
const form = useForm<TourFormValues>({
  resolver: zodResolver(tourSchema),
  defaultValues: {
    name: { es: '', en: '' },
    description: { es: '', en: '' },
    duration: 1,
    difficulty: 'moderate',
    location: '',
    itinerary: [],
    pricing: [{ minPax: 1, maxPax: 8, pricePerPerson: 0 }],
    images: { main: '', gallery: [] },
  }
});
```

**Tabs**:
1. **Basic Info**: Name, description, duration, difficulty, location
2. **Itinerary**: Day-by-day breakdown with add/remove
3. **Pricing**: Pricing tiers with add/remove
4. **Images**: Main image URL + gallery URLs

---

## 🪝 HOOKS USAGE GUIDE

### useBookings

**Purpose**: Fetch and manage bookings

**Signature**:
```typescript
function useBookings(filters?: BookingFilters): UseQueryResult<Booking[]>
```

**Example**:
```typescript
// All bookings
const { data: bookings, isLoading } = useBookings();

// Filtered by departure
const { data: departureBookings } = useBookings({ departureId: 'dep_123' });

// Filtered by status
const { data: confirmedBookings } = useBookings({ status: 'confirmed' });
```

### useBookingMutations

**Purpose**: Create, update, delete bookings

**Returns**:
```typescript
{
  createBooking: UseMutationResult,
  updateStatus: UseMutationResult,
  updatePax: UseMutationResult,
  updateDetails: UseMutationResult,
  applyDiscount: UseMutationResult,
  convertType: UseMutationResult,
  moveBooking: UseMutationResult,
}
```

**Example**:
```typescript
const { createBooking, updateStatus } = useBookingMutations();

// Create
createBooking.mutate({ tourId, date, pax, customer, type });

// Update status
updateStatus.mutate({ id: 'book_123', status: 'confirmed' });
```

### useDepartures

**Purpose**: Fetch departures (calendar view)

**Signature**:
```typescript
function useDepartures(filters?: DepartureFilters): UseQueryResult<Departure[]>
```

**Example**:
```typescript
// All departures
const { data: departures } = useDepartures();

// Filtered by month
const { data: decemberDepartures } = useDepartures({ month: '2025-12' });
```

### useTours

**Purpose**: Fetch tours

**Signature**:
```typescript
function useTours(): UseQueryResult<Tour[]>
```

**Example**:
```typescript
const { data: tours, isLoading } = useTours();

// In select dropdown
<select>
  {tours?.map(tour => (
    <option key={tour.tourId} value={tour.tourId}>
      {tour.name.es}
    </option>
  ))}
</select>
```

---

## 🎨 COMMON PATTERNS

### Pattern 1: Loading States

```typescript
function Component() {
  const { data, isLoading, error } = useQuery(...);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;
  
  return <div>{/* Render data */}</div>;
}
```

### Pattern 2: Optimistic Updates

```typescript
const updateBooking = useMutation({
  mutationFn: bookingsService.update,
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['booking', newData.id]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['booking', newData.id]);
    
    // Optimistically update
    queryClient.setQueryData(['booking', newData.id], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['booking', newData.id], context.previous);
  },
  onSettled: (newData) => {
    // Refetch to sync
    queryClient.invalidateQueries(['booking', newData.id]);
  },
});
```

### Pattern 3: Conditional Rendering (Tabs)

```typescript
<Tabs.Root defaultValue="details">
  <Tabs.List>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
    {bookingId && (
      <>
        <Tabs.Trigger value="status">Status</Tabs.Trigger>
        <Tabs.Trigger value="actions">Actions</Tabs.Trigger>
        <Tabs.Trigger value="transfer">Transfer</Tabs.Trigger>
      </>
    )}
  </Tabs.List>
  
  <Tabs.Content value="details">{/* ... */}</Tabs.Content>
  {bookingId && (
    <>
      <Tabs.Content value="status">{/* ... */}</Tabs.Content>
      <Tabs.Content value="actions">{/* ... */}</Tabs.Content>
      <Tabs.Content value="transfer">{/* ... */}</Tabs.Content>
    </>
  )}
</Tabs.Root>
```

### Pattern 4: Form with Validation

```typescript
const schema = z.object({
  email: z.string().email(),
  pax: z.number().min(1),
});

type FormValues = z.infer<typeof schema>;

function Component() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="number" {...register('pax', { valueAsNumber: true })} />
      {errors.pax && <span>{errors.pax.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Pattern 5: Toast Notifications

```typescript
const { success, error } = useToast();

const mutation = useMutation({
  mutationFn: api.create,
  onSuccess: () => {
    success('Created successfully!');
    onClose();
  },
  onError: (err) => {
    error(`Failed: ${err.message}`);
  },
});
```

---

## 🔍 DEBUGGING TIPS

### React Query Devtools

```typescript
// Add to App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Console Logging Patterns

```typescript
// Log query data
const { data } = useQuery(...);
useEffect(() => {
  console.log('Data updated:', data);
}, [data]);

// Log mutation
const mutation = useMutation({
  onMutate: (variables) => console.log('Mutating:', variables),
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
});
```

---

**Document**: Frontend Component Structure & Flows  
**Version**: 1.0  
**Last Updated**: November 25, 2025
