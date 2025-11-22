# BookingModal.tsx - UI Fixes to Apply

Este archivo contiene los 4 cambios exactos que necesitas aplicar a `BookingModal.tsx` manualmente o con un editor.

## Fix 1: Add Type Chip Badge (Lines 201-208)

**Ubicación**: Header del modal, junto al botón de cerrar

**BUSCAR** (lines 201-208):
```tsx
                    <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {bookingId ? 'Manage Booking' : 'New Booking'}
                        </Dialog.Title>
                        <Dialog.Close className="text-white/60 hover:text-white transition-colors" data-testid="close-modal-button">
                        
                        Thought for 5s
                        
                        
                        
                        
                        
                        
                        Analyzing Project State
                        Starting a comprehensive analysis of the project's backend and frontend to determine the current state.
                        
                        Progress Updates
                        1
                        Reading documentation and project structure
                        
                        Analyzed
                        dnekcab-kert-odaven\tnempoleveD kerT odaveN\:d
                        Analyzed
                        BOOKINGMODAL_FIXES.md#L1-166
                        
                        Generating
                            <X size={24} />
                        </Dialog.Close>
                    </div>
```

**REEMPLAZAR CON**:
```tsx
                    <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {bookingId ? 'Manage Booking' : 'New Booking'}
                        </Dialog.Title>
                        <div className="flex items-center gap-3">
                            {departure && (
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    departure.type === 'private' 
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`} data-testid="booking-type-chip">
                                    {departure.type === 'private' ? 'Private' : 'Public'}
                                </div>
                            )}
                            <Dialog.Close className="text-white/60 hover:text-white transition-colors" data-testid="close-modal-button">
                                <X size={24} />
                            </Dialog.Close>
                        </div>
                    </div>
```

---

## Fix 2: Change "Payment Status" to "Booking Status" (Line 370)

**Ubicación**: Status & Type tab

**BUSCAR**:
```tsx
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <CreditCard size={18} /> Payment Status
                                                </h3>
```

**REEMPLAZAR CON**:
```tsx
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <CreditCard size={18} /> Booking Status
                                                </h3>
```

---

## Fix 3: Remove Duplicate "Convert Type" Section (Lines 390-437)

**Ubicación**: Status & Type tab, después de la lista de status buttons

**ELIMINAR COMPLETAMENTE** esta sección entera (lines ~390-437):
```tsx
                                            <div className="glass-panel p-4 rounded-xl space-y-4">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <ArrowRightLeft size={18} /> Convert Type
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {departure?.type === 'private' ? (
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-white/60">
                                                                Current: Private Departure
                                                            </p>
                                                            <LiquidButton
                                                                size="sm"
                                                                onClick={() => convertType.mutate({ id: bookingId, targetType: 'public' })}
                                                                isLoading={convertType.isPending}
                                                                disabled={booking?.pax > 8}
                                                                data-testid="convert-public-button"
                                                            >
                                                                Convert to Public
                                                            </LiquidButton>
                                                            {booking?.pax > 8 && (
                                                                <p className="text-xs text-amber-400">
                                                                    ⚠️ Cannot convert: {booking.pax} pax exceeds public limit (8)
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-white/60">
                                                                Current: Public Departure
                                                            </p>
                                                            <LiquidButton
                                                                size="sm"
                                                                onClick={() => convertType.mutate({ id: bookingId, targetType: 'private' })}
                                                                isLoading={convertType.isPending}
                                                                data-testid="inline-convert-private-button"
                                                            >
                                                                Convert to Private
                                                            </LiquidButton>
                                                            <p className="text-xs text-white/60">
                                                                ℹ️ This will create a new private departure for this booking
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
```

**NOTA**: Deja solo la sección de "Booking Status" buttons, y elimina por completo todo el bloque "Convert Type". La funcionalidad de Convert Type se mantiene en el tab "Actions".

---

## Fix 4: Add Capacity Validation Before PAX Update (Lines ~137-157)

**Ubicación**: En la función `onSubmit`, actualizar la sección de PAX update

**BUSCAR** (dentro de onSubmit function):
```tsx
            if (booking?.pax !== data.pax) {
                updatePax.mutate({ id: bookingId, pax: data.pax });
            }
```

**REEMPLAZAR CON**:
```tsx
            // Update PAX with capacity validation
            if (booking?.pax !== data.pax && departure && booking) {
                // Calculate available space
                const otherBookingsPax = departure.currentPax - booking.pax;
                const availableSpace = departure.maxPax - otherBookingsPax;

                if (data.pax > availableSpace) {
                    // Show error - not enough capacity
                    alert(`Cannot increase to ${data.pax} pax. Only ${availableSpace} space(s) available in this departure.`);
                    return;
                }

                updatePax.mutate({ id: bookingId, pax: data.pax }, {
                    onSuccess: () => {
                        // Query invalidation handled in useBookings hook
                    }
                });
            }
```

---

## Resumen de Cambios

1. ✅ **Type Chip**: Muestra "Private" (morado) o "Public" (azul) junto al botón X
2. ✅ **Status Label**: Cambia "Payment Status" → "Booking Status"
3. ✅ **Remove Duplicate**: Elimina la sección "Convert Type" del tab "Status & Type"
4. ✅ **Capacity Validation**: Valida que haya espacio antes de aumentar PAX

Una vez aplicados estos cambios, los tests E2E deberían pasar de 5/45 a ~11/45, mostrando feedback visual correcto y validación de capacidad.
