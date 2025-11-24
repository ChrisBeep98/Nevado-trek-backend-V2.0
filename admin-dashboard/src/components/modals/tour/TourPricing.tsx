import { useFieldArray } from 'react-hook-form';
import type { UseFormRegister, Control } from 'react-hook-form';
import type { TourFormValues } from '../TourModal';

interface TourPricingProps {
    register: UseFormRegister<TourFormValues>;
    control: Control<TourFormValues>;
}

export function TourPricing({ register, control }: TourPricingProps) {
    const { fields } = useFieldArray({ control, name: "pricingTiers" });
    console.error('TourPricing fields length:', fields.length);

    return (
        <div className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium">Pricing Tiers</h3>
                    <span className="text-xs text-white/40">Define prices based on group size</span>
                </div>

                <div className="grid grid-cols-5 gap-4 text-sm text-white/60 mb-2 px-2">
                    <div>Min Pax</div>
                    <div>Max Pax</div>
                    <div>Price COP</div>
                    <div>Price USD</div>
                    <div></div>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-5 gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="relative">
                                <input
                                    type="number"
                                    {...register(`pricingTiers.${index}.minPax`, { valueAsNumber: true })}
                                    className="glass-input w-full text-center bg-black/20"
                                    readOnly
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    {...register(`pricingTiers.${index}.maxPax`, { valueAsNumber: true })}
                                    className="glass-input w-full text-center bg-black/20"
                                    readOnly
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">$</span>
                                <input
                                    type="number"
                                    {...register(`pricingTiers.${index}.priceCOP`, { valueAsNumber: true })}
                                    className="glass-input w-full pl-6"
                                    placeholder="COP"
                                    data-testid={`input-tier-${index}-price-cop`}
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">$</span>
                                <input
                                    type="number"
                                    {...register(`pricingTiers.${index}.priceUSD`, { valueAsNumber: true })}
                                    className="glass-input w-full pl-6"
                                    placeholder="USD"
                                    data-testid={`input-tier-${index}-price-usd`}
                                />
                            </div>
                            <div className="text-xs text-white/40 text-center">
                                {index === 0 && "Solo Traveler"}
                                {index === 1 && "Couples"}
                                {index === 2 && "Small Group"}
                                {index === 3 && "Large Group"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
