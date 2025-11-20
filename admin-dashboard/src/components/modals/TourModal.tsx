import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LiquidButton } from '../ui/LiquidButton';
import { useTour, useTours } from '../../hooks/useTours';
import { ItineraryDay } from './tour/ItineraryDay';

// Schema
const bilingualSchema = z.object({ es: z.string().min(1), en: z.string().min(1) });

const tourSchema = z.object({
    name: bilingualSchema,
    description: bilingualSchema,
    shortDescription: bilingualSchema.optional(),
    isActive: z.boolean(),
    type: z.enum(['multi-day', 'single-day']),
    totalDays: z.number().min(1),
    difficulty: z.string().min(1),
    pricingTiers: z.array(z.object({
        minPax: z.number(),
        maxPax: z.number(),
        priceCOP: z.number(),
        priceUSD: z.number()
    })).length(4),
    // Extended fields
    location: bilingualSchema.optional(),
    temperature: z.number().optional(),
    distance: z.number().optional(),
    altitude: bilingualSchema.optional(),
    faqs: z.array(z.object({
        question: bilingualSchema,
        answer: bilingualSchema
    })).optional(),
    inclusions: z.array(bilingualSchema).optional(),
    exclusions: z.array(bilingualSchema).optional(),
    recommendations: z.array(bilingualSchema).optional(),
    itinerary: z.object({
        days: z.array(z.object({
            dayNumber: z.number(),
            title: bilingualSchema,
            activities: z.array(bilingualSchema)
        }))
    }).optional(),
    images: z.array(z.string().url()).optional()
});

type TourFormValues = z.infer<typeof tourSchema>;

interface TourModalProps {
    isOpen: boolean;
    onClose: () => void;
    tourId?: string;
}

export function TourModal({ isOpen, onClose, tourId }: TourModalProps) {
    const { data: tour } = useTour(tourId);
    const { createTour, updateTour, isCreating, isUpdating } = useTours();

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<TourFormValues>({
        resolver: zodResolver(tourSchema),
        defaultValues: {
            isActive: true,
            type: 'multi-day',
            totalDays: 1,
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 0, priceUSD: 0 },
                { minPax: 2, maxPax: 2, priceCOP: 0, priceUSD: 0 },
                { minPax: 3, maxPax: 3, priceCOP: 0, priceUSD: 0 },
                { minPax: 4, maxPax: 8, priceCOP: 0, priceUSD: 0 }
            ],
            name: { es: '', en: '' },
            description: { es: '', en: '' },
            difficulty: 'Medium',
            faqs: [],
            inclusions: [],
            exclusions: [],
            recommendations: [],
            itinerary: { days: [] },
            images: []
        }
    });

    const { fields: pricingFields } = useFieldArray({ control, name: "pricingTiers" });
    const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faqs" });
    const { fields: incFields, append: appendInc, remove: removeInc } = useFieldArray({ control, name: "inclusions" });
    const { fields: excFields, append: appendExc, remove: removeExc } = useFieldArray({ control, name: "exclusions" });
    const { fields: recFields, append: appendRec, remove: removeRec } = useFieldArray({ control, name: "recommendations" });
    const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({ control, name: "itinerary.days" });
    const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control, name: "images" as any }); // Cast for simple array

    useEffect(() => {
        if (tour) {
            reset(tour as any);
        } else if (!tourId) {
            reset({
                isActive: true,
                type: 'multi-day',
                totalDays: 1,
                pricingTiers: [
                    { minPax: 1, maxPax: 1, priceCOP: 0, priceUSD: 0 },
                    { minPax: 2, maxPax: 2, priceCOP: 0, priceUSD: 0 },
                    { minPax: 3, maxPax: 3, priceCOP: 0, priceUSD: 0 },
                    { minPax: 4, maxPax: 8, priceCOP: 0, priceUSD: 0 }
                ],
                name: { es: '', en: '' },
                description: { es: '', en: '' },
                difficulty: 'Medium',
                faqs: [],
                inclusions: [],
                exclusions: [],
                recommendations: [],
                itinerary: { days: [] },
                images: []
            });
        }
    }, [tour, tourId, reset]);

    const onSubmit = (data: TourFormValues) => {
        if (tourId) {
            updateTour({ id: tourId, data }, { onSuccess: onClose });
        } else {
            createTour(data, { onSuccess: onClose });
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                    <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {tourId ? 'Edit Tour' : 'New Tour'}
                        </Dialog.Title>
                        <Dialog.Close className="text-white/60 hover:text-white transition-colors">
                            <X size={24} />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                        <Tabs.Root defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 border-b border-white/10">
                                <Tabs.List className="flex gap-6 overflow-x-auto">
                                    {['Basic', 'Pricing', 'Itinerary', 'Details', 'Images'].map(tab => (
                                        <Tabs.Trigger
                                            key={tab}
                                            value={tab.toLowerCase()}
                                            className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors whitespace-nowrap"
                                        >
                                            {tab}
                                        </Tabs.Trigger>
                                    ))}
                                </Tabs.List>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* BASIC INFO */}
                                <Tabs.Content value="basic" className="space-y-6 outline-none">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Name (ES)</label>
                                            <input {...register('name.es')} className="glass-input w-full" placeholder="Nombre del tour" />
                                            {errors.name?.es && <span className="text-rose-400 text-xs">{errors.name.es.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Name (EN)</label>
                                            <input {...register('name.en')} className="glass-input w-full" placeholder="Tour Name" />
                                            {errors.name?.en && <span className="text-rose-400 text-xs">{errors.name.en.message}</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Description (ES)</label>
                                            <textarea {...register('description.es')} className="glass-input w-full h-24 resize-none" placeholder="Descripción..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Description (EN)</label>
                                            <textarea {...register('description.en')} className="glass-input w-full h-24 resize-none" placeholder="Description..." />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Type</label>
                                            <select {...register('type')} className="glass-input w-full">
                                                <option value="multi-day">Multi-Day</option>
                                                <option value="single-day">Single-Day</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Total Days</label>
                                            <input type="number" {...register('totalDays', { valueAsNumber: true })} className="glass-input w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Difficulty</label>
                                            <input {...register('difficulty')} className="glass-input w-full" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" {...register('isActive')} id="isActive" className="w-4 h-4 rounded border-white/20 bg-white/5" />
                                        <label htmlFor="isActive" className="text-white">Active (Visible to Public)</label>
                                    </div>
                                </Tabs.Content>

                                {/* PRICING */}
                                <Tabs.Content value="pricing" className="space-y-6 outline-none">
                                    <div className="space-y-4">
                                        <h3 className="text-white font-medium">Pricing Tiers</h3>
                                        <div className="grid grid-cols-5 gap-4 text-sm text-white/60 mb-2">
                                            <div>Min Pax</div>
                                            <div>Max Pax</div>
                                            <div>Price COP</div>
                                            <div>Price USD</div>
                                        </div>
                                        {pricingFields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-5 gap-4">
                                                <input type="number" {...register(`pricingTiers.${index}.minPax`, { valueAsNumber: true })} className="glass-input w-full" readOnly />
                                                <input type="number" {...register(`pricingTiers.${index}.maxPax`, { valueAsNumber: true })} className="glass-input w-full" readOnly />
                                                <input type="number" {...register(`pricingTiers.${index}.priceCOP`, { valueAsNumber: true })} className="glass-input w-full" placeholder="COP" />
                                                <input type="number" {...register(`pricingTiers.${index}.priceUSD`, { valueAsNumber: true })} className="glass-input w-full" placeholder="USD" />
                                            </div>
                                        ))}
                                    </div>
                                </Tabs.Content>

                                {/* ITINERARY */}
                                <Tabs.Content value="itinerary" className="space-y-6 outline-none">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-white font-medium">Daily Itinerary</h3>
                                        <LiquidButton type="button" size="sm" onClick={() => appendDay({ dayNumber: dayFields.length + 1, title: { es: '', en: '' }, activities: [] })}>
                                            <Plus size={16} /> Add Day
                                        </LiquidButton>
                                    </div>
                                    <div className="space-y-6">
                                        {dayFields.map((field, index) => (
                                            <ItineraryDay
                                                key={field.id}
                                                dayIndex={index}
                                                control={control}
                                                register={register}
                                                removeDay={removeDay}
                                            />
                                        ))}
                                        {dayFields.length === 0 && (
                                            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl text-white/40">
                                                <p>No days added to the itinerary yet.</p>
                                                <LiquidButton type="button" size="sm" variant="ghost" onClick={() => appendDay({ dayNumber: 1, title: { es: '', en: '' }, activities: [] })} className="mt-4">
                                                    Start Itinerary
                                                </LiquidButton>
                                            </div>
                                        )}
                                    </div>
                                </Tabs.Content>

                                {/* DETAILS */}
                                <Tabs.Content value="details" className="space-y-8 outline-none">
                                    {/* Metadata */}
                                    <div className="space-y-4">
                                        <h3 className="text-white font-medium border-b border-white/10 pb-2">Metadata</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-white/60 text-sm">Location (ES)</label>
                                                <input {...register('location.es')} className="glass-input w-full" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-white/60 text-sm">Location (EN)</label>
                                                <input {...register('location.en')} className="glass-input w-full" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-white/60 text-sm">Temperature (°C)</label>
                                                <input type="number" {...register('temperature', { valueAsNumber: true })} className="glass-input w-full" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-white/60 text-sm">Distance (km)</label>
                                                <input type="number" {...register('distance', { valueAsNumber: true })} className="glass-input w-full" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* FAQs */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-white font-medium border-b border-white/10 pb-2">FAQs</h3>
                                            <LiquidButton type="button" size="sm" onClick={() => appendFaq({ question: { es: '', en: '' }, answer: { es: '', en: '' } })}>
                                                <Plus size={16} /> Add FAQ
                                            </LiquidButton>
                                        </div>
                                        {faqFields.map((field, index) => (
                                            <div key={field.id} className="glass-panel p-4 rounded-xl space-y-3 relative group">
                                                <button type="button" onClick={() => removeFaq(index)} className="absolute top-2 right-2 text-white/20 hover:text-rose-400"><Trash2 size={14} /></button>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input {...register(`faqs.${index}.question.es`)} className="glass-input w-full text-sm" placeholder="Pregunta (ES)" />
                                                    <input {...register(`faqs.${index}.question.en`)} className="glass-input w-full text-sm" placeholder="Question (EN)" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <textarea {...register(`faqs.${index}.answer.es`)} className="glass-input w-full text-sm h-16" placeholder="Respuesta (ES)" />
                                                    <textarea {...register(`faqs.${index}.answer.en`)} className="glass-input w-full text-sm h-16" placeholder="Answer (EN)" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Inclusions */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-white font-medium border-b border-white/10 pb-2">Inclusions</h3>
                                            <LiquidButton type="button" size="sm" onClick={() => appendInc({ es: '', en: '' })}>
                                                <Plus size={16} /> Add
                                            </LiquidButton>
                                        </div>
                                        {incFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2 items-center">
                                                <input {...register(`inclusions.${index}.es`)} className="glass-input w-full text-sm" placeholder="Incluye (ES)" />
                                                <input {...register(`inclusions.${index}.en`)} className="glass-input w-full text-sm" placeholder="Includes (EN)" />
                                                <button type="button" onClick={() => removeInc(index)} className="text-white/40 hover:text-rose-400"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Exclusions */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-white font-medium border-b border-white/10 pb-2">Exclusions</h3>
                                            <LiquidButton type="button" size="sm" onClick={() => appendExc({ es: '', en: '' })}>
                                                <Plus size={16} /> Add
                                            </LiquidButton>
                                        </div>
                                        {excFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2 items-center">
                                                <input {...register(`exclusions.${index}.es`)} className="glass-input w-full text-sm" placeholder="Excluye (ES)" />
                                                <input {...register(`exclusions.${index}.en`)} className="glass-input w-full text-sm" placeholder="Excludes (EN)" />
                                                <button type="button" onClick={() => removeExc(index)} className="text-white/40 hover:text-rose-400"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recommendations */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-white font-medium border-b border-white/10 pb-2">Recommendations</h3>
                                            <LiquidButton type="button" size="sm" onClick={() => appendRec({ es: '', en: '' })}>
                                                <Plus size={16} /> Add
                                            </LiquidButton>
                                        </div>
                                        {recFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2 items-center">
                                                <input {...register(`recommendations.${index}.es`)} className="glass-input w-full text-sm" placeholder="Recomendación (ES)" />
                                                <input {...register(`recommendations.${index}.en`)} className="glass-input w-full text-sm" placeholder="Recommendation (EN)" />
                                                <button type="button" onClick={() => removeRec(index)} className="text-white/40 hover:text-rose-400"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </Tabs.Content>

                                {/* IMAGES */}
                                <Tabs.Content value="images" className="space-y-6 outline-none">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-white font-medium">Images</h3>
                                        <LiquidButton type="button" size="sm" onClick={() => appendImage('https://')}>
                                            <Plus size={16} /> Add URL
                                        </LiquidButton>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {imageFields.map((field, index) => (
                                            <div key={field.id} className="glass-panel p-2 rounded-xl relative group aspect-video flex items-center justify-center bg-black/20">
                                                <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:text-rose-400 z-10"><Trash2 size={14} /></button>
                                                <input
                                                    {...register(`images.${index}` as any)}
                                                    className="glass-input w-full absolute bottom-2 left-2 right-2 text-xs bg-black/80"
                                                    placeholder="Image URL"
                                                />
                                                <ImageIcon className="text-white/20" size={32} />
                                                {/* Preview logic would go here */}
                                            </div>
                                        ))}
                                    </div>
                                </Tabs.Content>
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0">
                                <LiquidButton type="button" variant="ghost" onClick={onClose}>Cancel</LiquidButton>
                                <LiquidButton type="submit" isLoading={isCreating || isUpdating}>
                                    {tourId ? 'Update Tour' : 'Create Tour'}
                                </LiquidButton>
                            </div>
                        </Tabs.Root>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
