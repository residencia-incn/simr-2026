import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '../ui';
import { getNumbering } from '../../utils/agreementUtils';

const AgreementItem = ({
    agreement,
    level = 1,
    index,
    onUpdate,
    onDelete,
    onAddChild,
    readOnly = false,
    maxDepth = 3
}) => {
    const canAddChildren = level < maxDepth;
    const numbering = getNumbering(level, index);

    // Calculate indentation based on level
    const indentClass = level === 1 ? '' : level === 2 ? 'ml-8' : 'ml-16';

    const handleTextChange = (e) => {
        onUpdate(agreement.id, { text: e.target.value });
    };

    const handleAddChild = () => {
        if (canAddChildren) {
            onAddChild(agreement.id);
        }
    };

    const handleDelete = () => {
        onDelete(agreement.id);
    };

    if (readOnly) {
        return (
            <div className={`${indentClass} mb-2`}>
                <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700 min-w-[2rem] mt-0.5">
                        {numbering}
                    </span>
                    <p className="text-gray-800 flex-1">{agreement.text}</p>
                </div>
                {agreement.children && agreement.children.length > 0 && (
                    <div className="mt-2">
                        {agreement.children.map((child, childIndex) => (
                            <AgreementItem
                                key={child.id}
                                agreement={child}
                                level={level + 1}
                                index={childIndex}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onAddChild={onAddChild}
                                readOnly={readOnly}
                                maxDepth={maxDepth}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`${indentClass} mb-3`}>
            <div className="flex items-start gap-2">
                {/* Numbering */}
                <span className="font-bold text-gray-600 min-w-[2rem] mt-2.5 text-sm">
                    {numbering}
                </span>

                {/* Input */}
                <div className="flex-1">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={agreement.text}
                            onChange={handleTextChange}
                            className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Acuerdo ${numbering}`}
                        />

                        {/* Delete button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>

                    {/* Add child button */}
                    {canAddChildren && (
                        <button
                            onClick={handleAddChild}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                        >
                            <Plus size={12} />
                            Agregar sub-punto
                        </button>
                    )}
                </div>
            </div>

            {/* Render children */}
            {agreement.children && agreement.children.length > 0 && (
                <div className="mt-2">
                    {agreement.children.map((child, childIndex) => (
                        <AgreementItem
                            key={child.id}
                            agreement={child}
                            level={level + 1}
                            index={childIndex}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            readOnly={readOnly}
                            maxDepth={maxDepth}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgreementItem;
