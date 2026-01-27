// Utility functions for hierarchical agreements

/**
 * Generate numbering based on level and index
 * Level 1: 1, 2, 3...
 * Level 2: a, b, c...
 * Level 3: i, ii, iii...
 */
export const getNumbering = (level, index) => {
    if (level === 1) return `${index + 1}.`;
    if (level === 2) return `${String.fromCharCode(97 + index)}.`; // a, b, c...
    if (level === 3) return toRoman(index + 1);
    return '';
};

/**
 * Convert number to lowercase roman numerals
 */
export const toRoman = (num) => {
    const romanNumerals = [
        'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
        'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'
    ];
    return romanNumerals[num - 1] || `${num}.`;
};

/**
 * Generate unique ID for agreement
 */
export const generateAgreementId = () => {
    return `agr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create empty agreement object
 */
export const createEmptyAgreement = () => ({
    id: generateAgreementId(),
    content: '',
    children: []
});

/**
 * Flatten hierarchical agreements for display/print
 * Returns array of { numbering, text, level }
 */
export const flattenAgreements = (agreements, level = 1, result = []) => {
    agreements.forEach((agreement, index) => {
        const numbering = getNumbering(level, index);
        result.push({
            numbering,
            content: agreement.content,
            level,
            id: agreement.id
        });

        if (agreement.children && agreement.children.length > 0) {
            flattenAgreements(agreement.children, level + 1, result);
        }
    });

    return result;
};

/**
 * Migrate old agreement format (array of strings) or JSON objects without IDs to new format
 */
export const migrateAgreements = (agreements) => {
    if (!agreements || agreements.length === 0) return [];

    return agreements.map(item => {
        // If it's already a full object with ID, just process children recursively
        if (typeof item === 'object' && item !== null && item.id) {
            return {
                ...item,
                children: migrateAgreements(item.children || [])
            };
        }

        // If it's a JSON object without ID (e.g. from next_meeting_agenda)
        if (typeof item === 'object' && item !== null && !item.id) {
            return {
                id: generateAgreementId(),
                content: item.content || '',
                children: migrateAgreements(item.children || [])
            };
        }

        // If it's a plain string
        return {
            id: generateAgreementId(),
            content: item || '',
            children: []
        };
    });
};

/**
 * Update agreement in tree by ID
 */
export const updateAgreementById = (agreements, id, updates) => {
    return agreements.map(agreement => {
        if (agreement.id === id) {
            return { ...agreement, ...updates };
        }
        if (agreement.children && agreement.children.length > 0) {
            return {
                ...agreement,
                children: updateAgreementById(agreement.children, id, updates)
            };
        }
        return agreement;
    });
};

/**
 * Delete agreement from tree by ID
 */
export const deleteAgreementById = (agreements, id) => {
    return agreements
        .filter(agreement => agreement.id !== id)
        .map(agreement => ({
            ...agreement,
            children: agreement.children ? deleteAgreementById(agreement.children, id) : []
        }));
};

/**
 * Add child to agreement by ID
 */
export const addChildToAgreement = (agreements, parentId, newChild) => {
    return agreements.map(agreement => {
        if (agreement.id === parentId) {
            return {
                ...agreement,
                children: [...(agreement.children || []), newChild]
            };
        }
        if (agreement.children && agreement.children.length > 0) {
            return {
                ...agreement,
                children: addChildToAgreement(agreement.children, parentId, newChild)
            };
        }
        return agreement;
    });
};

/**
 * Get depth of agreement tree
 */
export const getAgreementDepth = (agreements, currentDepth = 1) => {
    if (!agreements || agreements.length === 0) return currentDepth - 1;

    let maxDepth = currentDepth;
    agreements.forEach(agreement => {
        if (agreement.children && agreement.children.length > 0) {
            const childDepth = getAgreementDepth(agreement.children, currentDepth + 1);
            maxDepth = Math.max(maxDepth, childDepth);
        }
    });

    return maxDepth;
};
