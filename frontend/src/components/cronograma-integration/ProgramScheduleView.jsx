import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import client from '../../api/client';

// --- COMPONENTE ORDENABLE (EL BLOQUE) ---
const SortableBlockItem = ({ block, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-6">
            {/* HEADER DEL BLOQUE CON MANIJA DE ARRASTRE */}
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-t-lg border-b border-slate-200 dark:border-slate-700">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded touch-none"
                >
                    <GripVertical size={20} />
                </button>

                <div className="flex-1">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">{block.name}</h3>
                    <span className="text-xs text-slate-500 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {block.startTime.slice(0, 5)} - {block.endTime.slice(0, 5)}
                    </span>
                </div>
            </div>

            {/* CUERPO DEL BLOQUE (Las actividades) */}
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 border-t-0 rounded-b-lg p-4 min-h-[50px] space-y-2">
                {children}
            </div>
        </div>
    );
};

// --- VISTA PRINCIPAL ---
const ProgramScheduleView = ({ initialBlocks, refreshData }) => {
    const [blocks, setBlocks] = useState(initialBlocks);

    // Sync with props if they change (e.g. day selection)
    useEffect(() => {
        setBlocks(initialBlocks);
    }, [initialBlocks]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {

            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);

            // Optimistic UI Update
            const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex);
            setBlocks(reorderedBlocks);

            // Backend Swap
            try {
                await client.post('/program/blocks/swap', null, {
                    params: {
                        block_id_1: active.id,
                        block_id_2: over.id
                    }
                });
                // Success message or toast could go here
                await refreshData();
            } catch (error) {
                console.error("Error al intercambiar bloques", error);
                // Revert on error
                setBlocks(initialBlocks);
                alert("No se pudo mover el bloque. Revisa la consola.");
            }
        }
    };

    if (!blocks || blocks.length === 0) {
        return <div className="p-8 text-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl">No hay bloques horarios configurados para este día.</div>;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4 p-4 max-w-3xl mx-auto">
                    {blocks.map((block) => (
                        <SortableBlockItem key={block.id} block={block}>
                            {(!block.activities || block.activities.length === 0) ? (
                                <div className="text-slate-300 text-center py-2 italic text-sm">Sin actividades</div>
                            ) : (
                                block.activities.map(act => (
                                    <div key={act.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-blue-200 transition-colors">
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{act.title}</div>
                                            <div className="text-xs text-slate-500">{act.timeStart} - {act.timeEnd}</div>
                                        </div>
                                        {act.status === 'Publicado' && <span className="size-2 bg-green-500 rounded-full" title="Publicado"></span>}
                                        {act.status === 'Borrador' && <span className="size-2 bg-amber-500 rounded-full" title="Borrador"></span>}
                                    </div>
                                ))
                            )}
                        </SortableBlockItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default ProgramScheduleView;
