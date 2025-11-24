import { useFieldArray, Controller } from 'react-hook-form';
import type { UseFormRegister, Control, FieldErrors } from 'react-hook-form';
import type { TourFormValues } from '../TourModal';
import { LiquidButton } from '../../ui/LiquidButton';
import { Plus, Trash2 } from 'lucide-react';

interface TourDetailsProps {
    register: UseFormRegister<TourFormValues>;
    control: Control<TourFormValues>;
    errors: FieldErrors<TourFormValues>;
}

export function TourDetails({ register, control, errors }: TourDetailsProps) {
    const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faqs" });
    const { fields: incFields, append: appendInc, remove: removeInc } = useFieldArray({ control, name: "inclusions" });
    const { fields: excFields, append: appendExc, remove: removeExc } = useFieldArray({ control, name: "exclusions" });
    const { fields: recFields, append: appendRec, remove: removeRec } = useFieldArray({ control, name: "recommendations" });

    return (
        <div className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metadata */}
            <div className="space-y-4">
                <h3 className="text-white font-medium border-b border-white/10 pb-2">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm">Location (ES)</label>
                        <input
                            data-testid="input-location-es"
                            {...register('location.es')}
                            className="glass-input w-full"
                            placeholder="e.g. Sierra Nevada"
                        />
                        {errors.location?.es && <span className="text-rose-400 text-xs">{errors.location.es.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm">Location (EN)</label>
                        <input
                            data-testid="input-location-en"
                            {...register('location.en')}
                            className="glass-input w-full"
                            placeholder="e.g. Sierra Nevada"
                        />
                        {errors.location?.en && <span className="text-rose-400 text-xs">{errors.location.en.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-white/60 text-sm">Temperature (°C)</label>
                        <Controller
                            name="temperature"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="number"
                                    className="glass-input w-full"
                                    placeholder="15"
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    data-testid="input-temperature"
                                />
                            )}
                        />
                        {errors.temperature && <span className="text-rose-400 text-xs">{errors.temperature.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-white/60 text-sm">Distance (km)</label>
                        <Controller
                            name="distance"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="number"
                                    className="glass-input w-full"
                                    placeholder="10"
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    data-testid="input-distance"
                                />
                            )}
                        />
                        {errors.distance && <span className="text-rose-400 text-xs">{errors.distance.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-white/60 text-sm">Altitude (ES)</label>
                        <input
                            {...register('altitude.es')}
                            className="glass-input w-full"
                            data-testid="input-altitude-es"
                            placeholder="e.g. 2500m"
                        />
                        {errors.altitude?.es && <span className="text-rose-400 text-xs">{errors.altitude.es.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm">Altitude (EN)</label>
                        <input
                            {...register('altitude.en')}
                            className="glass-input w-full"
                            data-testid="input-altitude-en"
                            placeholder="e.g. 8200ft"
                        />
                        {errors.altitude?.en && <span className="text-rose-400 text-xs">{errors.altitude.en.message}</span>}
                    </div>
                </div>
            </div>

            {/* FAQs */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium border-b border-white/10 pb-2">FAQs</h3>
                    <LiquidButton type="button" size="sm" onClick={() => appendFaq({ question: { es: '', en: '' }, answer: { es: '', en: '' } })} data-testid="add-faq-button">
                        <Plus size={16} /> Add FAQ
                    </LiquidButton>
                </div>
                {faqFields.map((field, index) => (
                    <div key={field.id} className="glass-panel p-4 rounded-xl space-y-3 relative group" data-testid={`faq-item-${index}`}>
                        <button type="button" onClick={() => removeFaq(index)} className="absolute top-2 right-2 text-white/20 hover:text-rose-400"><Trash2 size={14} /></button>
                        <div className="grid grid-cols-2 gap-2">
                            <input {...register(`faqs.${index}.question.es`)} className="glass-input w-full text-sm" placeholder="Pregunta (ES)" data-testid={`faq-question-es-${index}`} />
                            <input {...register(`faqs.${index}.question.en`)} className="glass-input w-full text-sm" placeholder="Question (EN)" data-testid={`faq-question-en-${index}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <textarea {...register(`faqs.${index}.answer.es`)} className="glass-input w-full text-sm h-16" placeholder="Respuesta (ES)" data-testid={`faq-answer-es-${index}`} />
                            <textarea {...register(`faqs.${index}.answer.en`)} className="glass-input w-full text-sm h-16" placeholder="Answer (EN)" data-testid={`faq-answer-en-${index}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Inclusions */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium border-b border-white/10 pb-2">Inclusions</h3>
                    <LiquidButton type="button" size="sm" onClick={() => appendInc({ es: '', en: '' })} data-testid="add-inclusion-button">
                        <Plus size={16} /> Add
                    </LiquidButton>
                </div>
                {incFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center" data-testid={`inclusion-item-${index}`}>
                        <input {...register(`inclusions.${index}.es`)} className="glass-input w-full text-sm" placeholder="Incluye (ES)" data-testid={`inclusion-es-${index}`} />
                        <input {...register(`inclusions.${index}.en`)} className="glass-input w-full text-sm" placeholder="Includes (EN)" data-testid={`inclusion-en-${index}`} />
                        <button type="button" onClick={() => removeInc(index)} className="text-white/40 hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>

            {/* Exclusions */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium border-b border-white/10 pb-2">Exclusions</h3>
                    <LiquidButton type="button" size="sm" onClick={() => appendExc({ es: '', en: '' })} data-testid="add-exclusion-button">
                        <Plus size={16} /> Add
                    </LiquidButton>
                </div>
                {excFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center" data-testid={`exclusion-item-${index}`}>
                        <input {...register(`exclusions.${index}.es`)} className="glass-input w-full text-sm" placeholder="Excluye (ES)" data-testid={`exclusion-es-${index}`} />
                        <input {...register(`exclusions.${index}.en`)} className="glass-input w-full text-sm" placeholder="Excludes (EN)" data-testid={`exclusion-en-${index}`} />
                        <button type="button" onClick={() => removeExc(index)} className="text-white/40 hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium border-b border-white/10 pb-2">Recommendations</h3>
                    <LiquidButton type="button" size="sm" onClick={() => appendRec({ es: '', en: '' })} data-testid="add-recommendation-button">
                        <Plus size={16} /> Add
                    </LiquidButton>
                </div>
                {recFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center" data-testid={`recommendation-item-${index}`}>
                        <input {...register(`recommendations.${index}.es`)} className="glass-input w-full text-sm" placeholder="Recomendación (ES)" data-testid={`recommendation-es-${index}`} />
                        <input {...register(`recommendations.${index}.en`)} className="glass-input w-full text-sm" placeholder="Recommendation (EN)" data-testid={`recommendation-en-${index}`} />
                        <button type="button" onClick={() => removeRec(index)} className="text-white/40 hover:text-rose-400"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}
