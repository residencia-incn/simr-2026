import React, { useState, useEffect } from 'react';
import { ChevronRight, Send, AlertCircle, Info, Users, User, Search, X, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import FormField from '../components/ui/FormField';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useForm } from '../hooks/useForm';
import { api } from '../services/api';

const SubmitWorkForm = ({ navigate }) => {
    const [loading, setLoading] = useState(true);
    const [academicConfig, setAcademicConfig] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [formSections, setFormSections] = useState([]);

    // Author State
    const [authorMode, setAuthorMode] = useState('single'); // 'single' | 'multiple'
    const [authors, setAuthors] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Mock Current User (In real app, get from Context/Auth)
    const currentUser = { id: 'u0', name: 'Dr. Usuario Actual', role: 'Autor Principal' };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [acConfig, sysConfig] = await Promise.all([
                    api.academic.getConfig(),
                    api.content.getConfig()
                ]);

                let sections = acConfig.sections || [];
                if (!sections.length && acConfig.wordLimits) {
                    sections = Object.entries(acConfig.wordLimits).map(([key, limit]) => ({
                        id: key,
                        label: key.charAt(0).toUpperCase() + key.slice(1),
                        limit,
                        active: true
                    }));
                }

                setFormSections(sections); // Store all sections, filtering happens in render/effect
                setAcademicConfig(acConfig);
                setSpecialties(sysConfig.specialties || []);

                // Init authors with current user
                setAuthors([currentUser]);

            } catch (error) {
                console.error("Error loading config", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Search Effect
    useEffect(() => {
        const searchUsers = async () => {
            if (userSearchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await api.users.search(userSearchQuery);
                // Filter out already added authors
                const filtered = results.filter(u => !authors.some(a => a.id === u.id));
                setSearchResults(filtered);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [userSearchQuery, authors]);


    const countWords = (str) => {
        if (!str) return 0;
        return str.trim().split(/\s+/).length;
    };

    const validate = (values) => {
        const errors = {};
        if (!academicConfig) return errors;

        if (!values.type) errors.type = 'Seleccione un tipo';
        if (!values.specialty) errors.specialty = 'Seleccione una subespecialidad';

        if (!values.title) {
            errors.title = 'El título es obligatorio';
        } else {
            const titleLimit = academicConfig.titleWordLimit || 20;
            if (countWords(values.title) > titleLimit) {
                errors.title = `El título excede el límite de ${titleLimit} palabras`;
            }
        }

        formSections.forEach(section => {
            const val = values[section.id];
            if (!val) {
                errors[section.id] = 'Campo requerido';
            } else {
                const limit = section.limit || 0;
                if (limit > 0 && countWords(val) > limit) {
                    errors[section.id] = `Excede el límite de ${limit} palabras`;
                }
            }
        });

        const missingDeclarations = academicConfig.declarations
            .filter(d => d.required && !values.declarations?.[d.id]);

        if (missingDeclarations.length > 0) {
            errors.terms = 'Debe aceptar todas las declaraciones obligatorias';
        }

        return errors;
    };

    const initialValues = {
        type: '',
        specialty: '',
        title: '',
        declarations: {}
    };

    const {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
        setFieldValue
    } = useForm(initialValues, validate);

    useEffect(() => {
        if (academicConfig?.workTypes?.length && !values.type) {
            setFieldValue('type', academicConfig.workTypes[0]);
        }
        if (specialties?.length && !values.specialty) {
            setFieldValue('specialty', specialties[0]);
        }
    }, [academicConfig, specialties]);

    // Dynamic Sections Effect
    useEffect(() => {
        if (academicConfig && academicConfig.sections) {
            // Filter sections that are active globally AND active for the selected work type
            const relevantSections = academicConfig.sections.filter(s =>
                s.active &&
                (!s.workTypes || (values.type && s.workTypes.includes(values.type)))
            );
            setFormSections(relevantSections);
        }
    }, [values.type, academicConfig]);


    const onSubmit = async (formValues) => {
        const abstract = {};
        formSections.forEach(section => {
            abstract[section.id] = formValues[section.id];
        });

        const submission = {
            id: `TRB-${Date.now()}`,
            title: formValues.title,
            specialty: formValues.specialty,
            type: formValues.type,
            declarations: Object.keys(formValues.declarations).filter(k => formValues.declarations[k]),
            abstract,
            authors: authorMode === 'single' ? [currentUser] : authors,
            status: 'En Evaluación',
            date: new Date().toISOString()
        };

        console.log("Submitting:", submission);
        await api.works.create(submission);
        alert('Trabajo enviado con éxito');
        navigate('resident-dashboard');
    };

    const handleDeclarationChange = (id, checked) => {
        setFieldValue('declarations', { ...values.declarations, [id]: checked });
    };

    const handleAddAuthor = (user) => {
        setAuthors([...authors, { ...user, role: 'Co-autor' }]); // Default role
        setUserSearchQuery("");
        setSearchResults([]);
    };

    const handleRemoveAuthor = (id) => {
        setAuthors(authors.filter(a => a.id !== id));
    };

    if (loading) return <LoadingSpinner text="Cargando formulario..." className="py-20" />;

    const renderWordCounter = (section) => {
        const fieldName = section.id;
        const count = countWords(values[fieldName] || '');
        const limit = section.limit || 0;
        const isOver = limit > 0 && count > limit;

        return (
            <div key={section.id} className="relative">
                <FormField
                    label={section.label.toUpperCase()}
                    name={fieldName}
                    type="textarea"
                    value={values[fieldName] || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched[fieldName] && errors[fieldName]}
                    rows={4}
                    className="bg-white mb-1"
                />
                <div className={`text-xs text-right mb-4 font-medium ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
                    {count} / {limit} palabras
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto animate-fadeIn pb-20">
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <span className="cursor-pointer hover:text-blue-700" onClick={() => navigate('resident-dashboard')}>
                    Mi Panel
                </span>
                <ChevronRight size={14} />
                <span className="text-gray-900 font-medium">Nuevo Trabajo</span>
            </div>

            <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Envío de Trabajo Científico</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Authorship Section */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Autoría del Trabajo</label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="authorMode"
                                    checked={authorMode === 'single'}
                                    onChange={() => setAuthorMode('single')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Solo Autor (Yo)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="authorMode"
                                    checked={authorMode === 'multiple'}
                                    onChange={() => setAuthorMode('multiple')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Varios Autores</span>
                            </label>
                        </div>

                        {authorMode === 'multiple' && (
                            <div className="animate-fadeIn space-y-4">
                                <div className="space-y-2">
                                    {authors.map((author, idx) => (
                                        <div key={author.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {author.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{author.name}</p>
                                                    <p className="text-xs text-gray-500">{author.email}</p>
                                                </div>
                                                {idx === 0 && <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 font-medium">Principal (Tú)</span>}
                                            </div>
                                            {idx !== 0 && (
                                                <button type="button" onClick={() => handleRemoveAuthor(author.id)} className="text-gray-400 hover:text-red-500 p-1">
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="relative">
                                    <div className="flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden">
                                        <div className="pl-3 text-gray-400"><Search size={16} /></div>
                                        <input
                                            type="text"
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            placeholder="Buscar co-autor por nombre o correo..."
                                            className="w-full p-2 text-sm outline-none"
                                        />
                                        {isSearching && <div className="pr-3"><LoadingSpinner size="sm" /></div>}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {searchResults.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleAddAuthor(user)}
                                                    className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.institution} • {user.email}</p>
                                                    </div>
                                                    <Plus size={16} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {userSearchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
                                            No se encontraron usuarios registrados.
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Info size={12} /> Solo se pueden agregar usuarios registrados en el sistema.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            label="Tipo de Trabajo"
                            name="type"
                            type="select"
                            value={values.type}
                            onChange={handleChange}
                            options={academicConfig?.workTypes?.map(t => ({ label: t, value: t })) || []}
                            error={touched.type && errors.type}
                        />
                        <FormField
                            label="Subespecialidad (Tema)"
                            name="specialty"
                            type="select"
                            value={values.specialty}
                            onChange={handleChange}
                            options={specialties.map(s => ({ label: s, value: s }))}
                            error={touched.specialty && errors.specialty}
                        />
                    </div>

                    <div>
                        <FormField
                            label="Título del Trabajo"
                            name="title"
                            value={values.title}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.title && errors.title}
                            placeholder="Ej: Síndrome de Miller Fisher post-COVID..."
                            required
                        />
                        <div className={`text-xs text-right -mt-3 font-medium ${countWords(values.title) > (academicConfig.titleWordLimit || 20) ? 'text-red-600' : 'text-gray-400'
                            }`}>
                            {countWords(values.title)} / {academicConfig.titleWordLimit || 20} palabras
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2 mb-4 flex items-center justify-between">
                            <span>Resumen Estructurado</span>
                            <span className="text-xs font-normal text-gray-500 lowercase flex items-center gap-1">
                                <Info size={12} /> Respete los límites de palabras
                            </span>
                        </h3>

                        {formSections.length > 0 ? (
                            formSections.map(section => renderWordCounter(section))
                        ) : (
                            <div className="text-center py-4 text-gray-500 italic">
                                No hay secciones definidas para el resumen.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 space-y-3">
                        <h4 className="text-sm font-bold text-gray-700">Declaraciones Juradas</h4>
                        {academicConfig?.declarations?.map(decl => (
                            <div key={decl.id} className="flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    id={decl.id}
                                    checked={values.declarations?.[decl.id] || false}
                                    onChange={(e) => handleDeclarationChange(decl.id, e.target.checked)}
                                    className="mt-1 rounded text-blue-700 focus:ring-blue-500"
                                />
                                <label htmlFor={decl.id} className="cursor-pointer select-none">
                                    {decl.text} {decl.required && <span className="text-red-500">*</span>}
                                </label>
                            </div>
                        ))}

                        {errors.terms && (
                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1 ml-6">
                                <AlertCircle size={12} /> {errors.terms}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="secondary"
                            onClick={(e) => { e.preventDefault(); navigate('resident-dashboard'); }}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-700 text-white flex items-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enviando...' : <><Send size={18} /> Enviar Trabajo</>}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SubmitWorkForm;
