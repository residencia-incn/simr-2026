import React from 'react';
import { FileText, Upload, FileCheck, X, DollarSign, CreditCard } from 'lucide-react';
import { Button, Card, SectionHeader, InfoIcon, Modal, FormField, Table } from '../components/ui';
import { api } from '../services/api';
import { useForm, useModal, useFileUpload, useApi } from '../hooks';

const RegistrationView = () => {
    // Hooks
    const { isOpen: isCostsModalOpen, open: openCostsModal, close: closeCostsModal } = useModal();
    const { loading: isSubmitting, execute: submitRegistration } = useApi(api.registrations.add, false);

    // File Upload Hook
    const {
        file: voucherFile,
        preview: voucherPreview,
        handleFileChange,
        clearFile: clearVoucher,
        base64: voucherBase64,
        fileInputRef
    } = useFileUpload({
        maxSize: 5 * 1024 * 1024,
        acceptedTypes: ['image/*', 'application/pdf']
    });

    // Form Hook
    const { values: form, handleChange, setValues, reset: resetForm } = useForm({
        dni: '',
        cmp: '',
        name: '',
        specialty: '',
        year: '',
        institution: '',
        email: '',
        phone: '',
        modalidad: 'Presencial'
    });

    const calculateAmount = () => {
        if (form.year) return 50; // Residentes
        if (form.specialty && form.specialty.toLowerCase().includes('estudiante')) return 30;
        return 120; // Default specialist
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!voucherFile) {
            alert('Por favor adjunta tu voucher de pago.');
            return;
        }

        try {
            const amount = calculateAmount();
            const registrationData = {
                ...form,
                amount,
                role: form.year ? 'Residente' : (form.specialty.toLowerCase().includes('estudiante') ? 'Estudiante' : 'Especialista'),
                voucherData: voucherBase64
            };

            const result = await submitRegistration(registrationData);

            if (result) {
                alert('¡Inscripción enviada exitosamente! Tu pago será validado por tesorería en breve.');
                resetForm();
                clearVoucher();
            } else {
                alert('Hubo un error al guardar tu inscripción. Intenta nuevamente.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al procesar el archivo o enviar los datos.');
        }
    };

    return (
        <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto">
            <SectionHeader title="Inscripciones" subtitle="Regístrate para participar en el SIMR 2026. Por favor verifica los costos antes de realizar tu pago." />

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm"><InfoIcon /></div>
                    <div>
                        <h3 className="font-bold text-blue-900 mb-1">Información de Pago</h3>
                        <p className="text-sm text-blue-800 leading-relaxed">Antes de llenar el formulario, asegúrate de haber realizado el depósito o transferencia correspondiente. Necesitarás subir el comprobante.</p>
                    </div>
                </div>
                <Button onClick={openCostsModal} className="whitespace-nowrap shadow-lg hover:scale-105 transition-transform bg-blue-700"><DollarSign size={18} /> Ver Costos y Cuentas</Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card>
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText className="text-blue-700" /> Ficha de Inscripción</h3>
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="grid md:grid-cols-2 gap-5">
                                <FormField
                                    label="DNI / Pasaporte"
                                    name="dni"
                                    value={form.dni}
                                    onChange={handleChange}
                                    placeholder="Número de documento"
                                    required
                                />
                                <FormField
                                    label="N° CMP (Colegiatura)"
                                    name="cmp"
                                    value={form.cmp}
                                    onChange={handleChange}
                                    placeholder="Si aplica"
                                />
                            </div>

                            <FormField
                                label="Nombre Completo"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Apellidos y Nombres"
                                required
                            />

                            <div className="grid md:grid-cols-2 gap-5">
                                <FormField
                                    label="Especialidad / Profesión"
                                    name="specialty"
                                    value={form.specialty}
                                    onChange={handleChange}
                                    placeholder="Ej. Neurología, Estudiante..."
                                    required
                                />
                                <FormField
                                    label="Año de Residencia"
                                    name="year"
                                    type="select"
                                    value={form.year}
                                    onChange={handleChange}
                                    options={[
                                        { value: "", label: "No aplica" },
                                        { value: "R1", label: "R1" },
                                        { value: "R2", label: "R2" },
                                        { value: "R3", label: "R3" },
                                        { value: "R4", label: "R4" }
                                    ]}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <FormField
                                    label="Modalidad"
                                    name="modalidad"
                                    type="select"
                                    value={form.modalidad}
                                    onChange={handleChange}
                                    options={[
                                        { value: "Presencial", label: "Presencial" },
                                        { value: "Hibrido", label: "Híbrido" }
                                    ]}
                                />
                                <FormField
                                    label="Institución Laboral / Universidad"
                                    name="institution"
                                    value={form.institution}
                                    onChange={handleChange}
                                    placeholder="Hospital, Clínica o Universidad"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <FormField
                                    label="Correo Electrónico"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                                <FormField
                                    label="Teléfono / Celular"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Cargar Voucher de Pago</label>
                                {!voucherPreview ? (
                                    <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                                        <Upload className="text-gray-400 mb-2" size={32} />
                                        <span className="text-sm text-gray-600 font-medium">Clic para subir imagen o PDF</span>
                                        <span className="text-xs text-gray-400 mt-1">Máx. 5MB</span>
                                    </div>
                                ) : (
                                    <div className="relative border border-gray-200 rounded-xl overflow-hidden p-2 bg-gray-50 flex items-center gap-4">
                                        <div className="h-16 w-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0"><FileCheck className="text-green-500" /></div>
                                        <div className="flex-grow"><p className="text-sm font-bold text-gray-800">Voucher cargado</p><p className="text-xs text-gray-500">Listo para enviar</p></div>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); clearVoucher(); }} className="p-2 hover:bg-red-100 text-red-500 rounded-full"><X size={18} /></button>
                                    </div>
                                )}
                                <input required={!voucherPreview} type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            </div>

                            <div className="pt-2">
                                <Button disabled={isSubmitting} type="submit" className="w-full justify-center text-lg h-12 bg-blue-700 hover:bg-blue-800">
                                    {isSubmitting ? 'Enviando...' : 'Enviar Inscripción'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-gray-900 text-white border-none">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard size={20} /> Resumen</h4>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex justify-between"><span>Evento:</span><span className="font-bold text-white">SIMR 2026</span></li>
                            <li className="flex justify-between"><span>Modalidad:</span><span className="font-bold text-white">{form.modalidad === 'Hibrido' ? 'Híbrida' : form.modalidad}</span></li>
                            <li className="flex justify-between"><span>Certificación:</span><span className="font-bold text-white">2.0 Créditos</span></li>
                        </ul>
                        <div className="mt-6 pt-6 border-t border-gray-700"><p className="text-xs text-gray-400 mb-2">¿Necesitas ayuda?</p><p className="font-bold text-white">+51 999 888 777</p><p className="text-sm text-blue-300">inscripciones@simr.pe</p></div>
                    </Card>
                </div>
            </div>

            {isCostsModalOpen && (
                <Modal
                    isOpen={isCostsModalOpen}
                    onClose={closeCostsModal}
                    title="Tarifario 2026"
                    size="md"
                >
                    <div className="p-2">
                        <p className="text-blue-600 text-sm mb-4 text-center">Inversión para certificación y materiales</p>

                        <Table
                            columns={[
                                { header: 'Categoría', key: 'category' },
                                { header: 'Inversión', key: 'price', tdClassName: 'text-right font-bold text-blue-700' }
                            ]}
                            data={[
                                { category: 'Residentes INCN', price: 'S/. 50.00' },
                                { category: 'Residentes Externos', price: 'S/. 80.00' },
                                { category: 'Médicos Especialistas', price: 'S/. 120.00' },
                                { category: 'Estudiantes / Otros', price: 'S/. 30.00' }
                            ]}
                            className="mb-6 shadow-none border-0"
                        />

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Datos Bancarios
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p><span className="font-semibold block text-gray-800">Banco de la Nación:</span> Cuenta Corriente N° 00-000-123456</p>
                                <p><span className="font-semibold block text-gray-800">CCI:</span> 018-000-000000123456-00</p>
                                <p><span className="font-semibold block text-gray-800">Titular:</span> Asociación de Médicos Residentes INCN</p>
                                <p><span className="font-semibold block text-gray-800">Yape / Plin:</span> 999 888 777 (Tesorería)</p>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <Button onClick={closeCostsModal} className="w-full justify-center bg-blue-700">Entendido</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default RegistrationView;
