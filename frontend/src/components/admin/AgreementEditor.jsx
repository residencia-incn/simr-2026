import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui';
import AgreementItem from './AgreementItem';
import {
    createEmptyAgreement,
    updateAgreementById,
    deleteAgreementById,
    addChildToAgreement,
    migrateAgreements
} from '../../utils/agreementUtils';

const AgreementEditor = ({ agreements = [], onChange, readOnly = false, addButtonText = "Agregar Acuerdo" }) => {
    // Ensure agreements are in new format
    const normalizedAgreements = React.useMemo(() => {
        return migrateAgreements(agreements);
    }, [agreements]);

    const handleUpdate = (id, updates) => {
        const updated = updateAgreementById(normalizedAgreements, id, updates);
        onChange(updated);
    };

    const handleDelete = (id) => {
        const updated = deleteAgreementById(normalizedAgreements, id);
        onChange(updated);
    };

    const handleAddChild = (parentId) => {
        const newChild = createEmptyAgreement();
        const updated = addChildToAgreement(normalizedAgreements, parentId, newChild);
        onChange(updated);
    };

    const handleAddRoot = () => {
        const newAgreement = createEmptyAgreement();
        onChange([...normalizedAgreements, newAgreement]);
    };

    if (readOnly) {
        if (normalizedAgreements.length === 0) {
            return (
                <p className="text-sm text-gray-500 italic">
                    No se registraron acuerdos específicos.
                </p>
            );
        }

        return (
            <div className="space-y-2">
                {normalizedAgreements.map((agreement, index) => (
                    <AgreementItem
                        key={agreement.id}
                        agreement={agreement}
                        level={1}
                        index={index}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onAddChild={handleAddChild}
                        readOnly={true}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {normalizedAgreements.map((agreement, index) => (
                <AgreementItem
                    key={agreement.id}
                    agreement={agreement}
                    level={1}
                    index={index}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                    readOnly={false}
                />
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={handleAddRoot}
                className="w-full"
            >
                <Plus size={14} className="mr-1" />
                {addButtonText}
            </Button>
        </div>
    );
};

export default AgreementEditor;
