import React, { useState, useEffect, useCallback } from 'react';
import { useAulaVirtual } from '../../context/AulaVirtualContext';
import { VideoNote } from '../../types';

interface CourseNotesProps {
    courseId: number;
    moduleId: number;
    lessonId: number;
    videoId?: number;
    currentTime: number;
    onSeek: (time: number) => void;
}

interface NoteBlock {
    id: string;
    timestamp: number;
    formattedTime: string;
    content: string;
    isHighlighted?: boolean;
}

// Memoized Note Item Component to prevent re-renders when parent's currentTime updates
const NoteItem = React.memo(({
    block,
    onSeek,
    updateBlockContent,
    toggleHighlight,
    deleteBlock,
    setActiveBlockId
}: {
    block: NoteBlock,
    onSeek: (time: number) => void,
    updateBlockContent: (id: string, content: string) => void,
    toggleHighlight: (id: string) => void,
    deleteBlock: (id: string) => void,
    setActiveBlockId: (id: string) => void
}) => {
    return (
        <div className={`flex gap-3 ${block.isHighlighted ? 'pl-3 border-l-4 border-blue-500' : ''}`}>
            {/* Timestamp Column */}
            <div className="flex-shrink-0">
                <button
                    onClick={() => onSeek(block.timestamp)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded font-mono text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Ir a este momento"
                >
                    {block.formattedTime}
                </button>
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0">
                <div
                    contentEditable
                    suppressContentEditableWarning
                    className="outline-none text-sm text-slate-700 leading-relaxed min-h-[2em] focus:bg-slate-50 rounded px-2 py-1 transition-colors empty:before:content-['Escribe_aquí...'] empty:before:text-slate-400"
                    onBlur={(e) => updateBlockContent(block.id, e.currentTarget.innerHTML)}
                    onFocus={() => setActiveBlockId(block.id)}
                    dangerouslySetInnerHTML={{ __html: block.content }}
                />

                {/* Actions */}
                <div className="flex gap-2 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => toggleHighlight(block.id)}
                        className="text-xs text-slate-500 hover:text-blue-600"
                        title={block.isHighlighted ? 'Quitar destacado' : 'Destacar'}
                    >
                        {block.isHighlighted ? '★' : '☆'}
                    </button>
                    <button
                        onClick={() => deleteBlock(block.id)}
                        className="text-xs text-slate-500 hover:text-red-600"
                        title="Eliminar"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparison to prevent re-renders unless data changes
    return prev.block.id === next.block.id &&
        prev.block.content === next.block.content &&
        prev.block.isHighlighted === next.block.isHighlighted &&
        prev.block.timestamp === next.block.timestamp;
});

export const CourseNotes: React.FC<CourseNotesProps> = ({
    courseId,
    moduleId,
    lessonId,
    videoId,
    currentTime,
    onSeek
}) => {
    const { getUserNotes, saveUserNote } = useAulaVirtual();
    const [noteBlocks, setNoteBlocks] = useState<NoteBlock[]>([]);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

    useEffect(() => {
        // Load existing notes
        const existingNotes = getUserNotes(lessonId);
        if (existingNotes.length > 0) {
            try {
                const parsed = JSON.parse(existingNotes[0].content);
                if (Array.isArray(parsed)) {
                    setNoteBlocks(parsed);
                }
            } catch (e) {
                // If parsing fails, start fresh
                setNoteBlocks([]);
            }
        }
    }, [lessonId, getUserNotes]);

    const insertTimestamp = useCallback(() => {
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        setNoteBlocks(prev => {
            // Check for duplicate in functional update to ensure latest state
            if (prev.some(block => block.timestamp === currentTime)) {
                return prev;
            }
            const newBlock: NoteBlock = {
                id: `note-${Date.now()}`,
                timestamp: currentTime,
                formattedTime: formatted,
                content: '',
                isHighlighted: false
            };
            // setActiveBlockId(newBlock.id); // Cannot call setter inside setter. Move out or use effect.
            // Actually, we can't set activeBlockId here easily if we are inside setNoteBlocks.
            // Let's keep logic simple.
            return [...prev, newBlock];
        });
        // We can't set active ID easily if we don't know the ID (generated inside).
        // Let's generate ID outside.
    }, [currentTime]);

    // Better implementation of insertTimestamp to handle ID setting
    // But since I am replacing the block, I'll rewrite it properly below


    const updateBlockContent = useCallback((blockId: string, content: string) => {
        setNoteBlocks(blocks =>
            blocks.map(block =>
                block.id === blockId ? { ...block, content } : block
            )
        );
    }, []);

    const toggleHighlight = useCallback((blockId: string) => {
        setNoteBlocks(blocks =>
            blocks.map(block =>
                block.id === blockId ? { ...block, isHighlighted: !block.isHighlighted } : block
            )
        );
    }, []);

    const deleteBlock = useCallback((blockId: string) => {
        setNoteBlocks(blocks => blocks.filter(block => block.id !== blockId));
    }, []);

    const handleSave = useCallback(() => {
        const existingNotes = getUserNotes(lessonId);
        let noteId = existingNotes.length > 0 ? existingNotes[0].id : undefined;

        saveUserNote({
            id: noteId,
            courseId,
            moduleId,
            lessonId,
            videoId,
            content: JSON.stringify(noteBlocks),
            timestamp: 0, // Not used for this type of note
            formattedTimestamp: '00:00'
        });

        setLastSaved(new Date().toLocaleTimeString());
    }, [noteBlocks, getUserNotes, saveUserNote, lessonId, courseId, moduleId, videoId]);

    // Auto-save on changes (debounced)
    useEffect(() => {
        if (noteBlocks.length === 0) return;

        const timer = setTimeout(() => {
            handleSave();
        }, 2000);

        return () => clearTimeout(timer);
    }, [noteBlocks, handleSave]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={insertTimestamp}
                        className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 hover:text-primary hover:border-primary transition-colors"
                        title="Insertar Minuto Actual"
                    >
                        <span className="material-symbols-outlined text-[16px]">timer</span>
                        {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                    </button>

                    <button
                        onClick={handleSave}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        title="Guardar Notas"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                    </button>
                </div>

                {lastSaved && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Guardado a las {lastSaved}
                    </span>
                )}
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4">
                {noteBlocks.length === 0 ? (
                    <div className="text-center text-slate-400 mt-8">
                        <p className="text-sm">Haz clic en el botón del reloj para agregar una nota con timestamp</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {noteBlocks.map((block) => (
                            <NoteItem
                                key={block.id}
                                block={block}
                                onSeek={onSeek}
                                updateBlockContent={updateBlockContent}
                                toggleHighlight={toggleHighlight}
                                deleteBlock={deleteBlock}
                                setActiveBlockId={setActiveBlockId}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Help Tip */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
                Tus notas se guardan automáticamente
            </div>
        </div>
    );
};
