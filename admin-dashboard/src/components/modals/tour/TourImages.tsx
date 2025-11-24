import { useFieldArray, useWatch } from 'react-hook-form';
import type { UseFormRegister, Control } from 'react-hook-form';
import type { TourFormValues } from '../TourModal';
import { LiquidButton } from '../../ui/LiquidButton';
import { Plus, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

interface TourImagesProps {
    register: UseFormRegister<TourFormValues>;
    control: Control<TourFormValues>;
}

export function TourImages({ register, control }: TourImagesProps) {
    const { fields, append, remove } = useFieldArray({ control, name: "images" as any });

    // Watch images to show previews
    const images = useWatch({ control, name: "images" });

    const addRandomImage = () => {
        const randomId = Math.floor(Math.random() * 1000);
        append(`https://picsum.photos/seed/${randomId}/800/600`);
    };

    return (
        <div className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-white font-medium">Images</h3>
                <div className="flex gap-2">
                    <LiquidButton type="button" size="sm" variant="ghost" onClick={addRandomImage} data-testid="add-random-image-button">
                        <Sparkles size={16} /> Random Image
                    </LiquidButton>
                    <LiquidButton type="button" size="sm" onClick={() => append('')} data-testid="add-image-url-button">
                        <Plus size={16} /> Add URL
                    </LiquidButton>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="images-grid">
                {fields.map((field, index) => {
                    const imageUrl = images?.[index];

                    return (
                        <div key={field.id} className="glass-panel p-2 rounded-xl relative group aspect-video flex flex-col bg-black/20 overflow-hidden" data-testid={`image-item-${index}`}>
                            {/* Preview Background */}
                            {imageUrl && (
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={imageUrl}
                                        alt={`Preview ${index}`}
                                        className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:text-rose-400 hover:bg-black/80 z-20 transition-all"
                                data-testid={`remove-image-${index}`}
                            >
                                <Trash2 size={14} />
                            </button>

                            <div className="flex-1 flex items-center justify-center z-10 pointer-events-none">
                                {!imageUrl && <ImageIcon className="text-white/20" size={32} />}
                            </div>

                            <input
                                {...register(`images.${index}` as any)}
                                className="glass-input w-full absolute bottom-2 left-2 right-2 text-xs bg-black/80 z-20 w-[calc(100%-16px)]"
                                placeholder="https://example.com/image.jpg"
                                data-testid={`image-input-${index}`}
                            />
                        </div>
                    );
                })}
            </div>

            {fields.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl text-white/40 bg-white/5">
                    <p>No images added yet.</p>
                    <div className="flex justify-center gap-4 mt-4">
                        <LiquidButton type="button" size="sm" variant="ghost" onClick={addRandomImage} data-testid="add-random-image-empty-button">
                            <Sparkles size={16} /> Add Random
                        </LiquidButton>
                    </div>
                </div>
            )}
        </div>
    );
}
