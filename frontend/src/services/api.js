import { storage, STORAGE_KEYS as ORIG_KEYS } from './storage';
import { authService } from '../api/auth';
import client from '../api/client';

const STORAGE_KEYS = {
    ...ORIG_KEYS,
    ROLE_DEFAULTS: 'simr_role_defaults',
    PROGRAM_CONFIG: 'simr_program_config_v2'
};

const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const canUserAccessCourse = (_user, _course) => {
    return true; // Simplified for now, backend enforces access
};

export const api = {
    // --- Upload Service ---
    upload: {
        image: async (file) => {
            await delay(1000);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        resolve(compressedDataUrl);
                    };
                    img.onerror = (error) => reject(error);
                };
                reader.onerror = error => reject(error);
            });
        }
    },

    // --- 0. Notifications ---
    notifications: {
        getAll: async () => {
            await delay();
            return storage.get(STORAGE_KEYS.NOTIFICATIONS, []);
        },
        add: async (notification) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.NOTIFICATIONS, []);
            const newNotification = {
                id: `NTF-${Date.now()}`,
                timestamp: new Date().toISOString(),
                read: false,
                ...notification
            };
            storage.set(STORAGE_KEYS.NOTIFICATIONS, [newNotification, ...current]);
            return newNotification;
        },
        markAsRead: async (id) => {
            await delay();
            const current = storage.get(STORAGE_KEYS.NOTIFICATIONS, []);
            const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
            storage.set(STORAGE_KEYS.NOTIFICATIONS, updated);
            return true;
        },
        clear: async () => {
            await delay();
            storage.set(STORAGE_KEYS.NOTIFICATIONS, []);
            return true;
        }
    },

    // --- 1. System Config ---
    config: {
        getCatalog: async () => {
            const response = await client.get('/config/catalog');
            return response.data;
        }
    },
    system: {
        getConfig: async () => {
            const response = await client.get('/config');
            return response.data;
        },
        getModalities: async () => {
            const response = await client.get('/config/modalities');
            return response.data;
        },
        getRoles: async () => {
            const response = await client.get('/config/roles');
            return response.data;
        },
        getWorkshops: async () => {
            const res = await client.get('/config/workshops');
            return res.data || [];
        },
        getRoleDefaults: async () => {
            const response = await client.get('/config/roles-matrix');
            return response.data;
        },
        getRolesMatrix: async () => {
            const response = await client.get('/config/roles-matrix');
            return response.data;
        },
        saveRoleDefaults: async (defaults) => {
            const response = await client.put('/config/role-defaults', defaults);
            return response.data;
        }
    },

    // --- 2. Users ---
    users: {
        getAll: async () => {
            const response = await client.get('/users/');
            return response.data;
        },
        getById: async (id) => {
            const response = await client.get(`/users/${id}`);
            return response.data;
        },
        search: async (q, role = null) => {
            const params = { q };
            if (role) { params.role = role; }
            const response = await client.get('/users', { params });
            return response.data;
        },
        add: async (user) => {
            const response = await client.post('/users', user);
            return response.data;
        },
        update: async (user) => {
            const response = await client.put(`/users/${user.id}`, user);
            return response.data;
        },
        delete: async (id) => {
            const response = await client.delete(`/users/${id}`);
            return response.data;
        },
        resetPassword: async (id) => {
            const response = await client.post(`/users/${id}/reset-password`);
            return response.data;
        }
    },

    // --- 3. Registrations ---
    registrations: {
        getAll: async () => {
            const response = await client.get('/accounting/requests');
            return response.data;
        },
        add: async (registration) => {
            const response = await client.post('/registrations', registration);
            return response.data;
        },
        getRecentApproved: async (limit = 5) => {
            const response = await client.get('/accounting/transactions/recent-approved', { params: { limit } });
            return response.data;
        },
        getTransactionHistory: async () => {
            const response = await client.get('/accounting/transactions/history');
            return response.data;
        },
        approve: async (reg) => {
            const response = await client.post(`/accounting/requests/${reg.id}/approve`);
            return response.data;
        },
        remove: async (id) => {
            const response = await client.post(`/accounting/requests/${id}/reject`, { reason: 'Rechazado por tesorería' });
            return response.data;
        }
    },

    // --- 4. Program (Agenda) ---
    program: {
        getPublicView: async () => {
            const response = await client.get('/program/public');
            return response.data;
        },
        getAll: async () => {
            // Used by AcademicSpeakers to map sessions
            // Using /program/public as it returns the grouped list
            const response = await client.get('/program/public');
            return response.data;
        },
        getDays: async () => {
            const response = await client.get('/program/config');
            return response.data.days || [];
        },
        getConfig: async () => {
            const response = await client.get('/program/config');
            return response.data;
        },
        createBlock: async (block) => {
            const response = await client.post('/program/blocks', block);
            return response.data;
        },
        deleteBlock: async (id, force = false) => {
            const params = force ? { force: true } : {};
            const response = await client.delete(`/program/blocks/${id}`, { params });
            return response.data;
        },
        getLocations: async () => {
            const response = await client.get('/program/locations');
            return response.data;
        },
        createLocation: async (location) => {
            const response = await client.post('/program/locations', location);
            return response.data;
        },
        updateLocation: async (id, location) => {
            const response = await client.put(`/program/locations/${id}`, location);
            return response.data;
        },
        deleteLocation: async (id) => {
            const response = await client.delete(`/program/locations/${id}`);
            return response.data;
        },
        getActivities: async (day = null) => {
            const params = day ? { day } : {};
            const response = await client.get('/program/activities/admin', { params });
            return response.data;
        },
        createActivity: async (activity) => {
            const response = await client.post('/program/activities', activity);
            return response.data;
        },
        updateActivity: async (id, activity) => {
            const response = await client.put(`/program/activities/${id}`, activity);
            return response.data;
        },
        deleteActivity: async (id) => {
            const response = await client.delete(`/program/activities/${id}`);
            return response.data;
        }
    },

    // --- 5. Committee ---
    committee: {
        getAll: async () => {
            const response = await client.get('/committee/');
            return response.data;
        },
        getCandidates: async () => {
            const response = await client.get('/committee/candidates');
            return response.data;
        },
        create: async (data) => {
            const response = await client.post('/committee/', data);
            return response.data;
        },
        remove: async (id) => {
            const response = await client.delete(`/committee/${id}`);
            return response.data;
        },
        getGroups: async () => {
            const response = await client.get('/committee/groups');
            return response.data;
        },
        createGroup: async (data) => {
            const response = await client.post('/committee/groups', data);
            return response.data;
        },
        updateGroup: async (id, data) => {
            const response = await client.put(`/committee/groups/${id}`, data);
            return response.data;
        },
        deleteGroup: async (id) => {
            const response = await client.delete(`/committee/groups/${id}`);
            return response.data;
        }
    },

    // --- 6. Content ---
    content: {
        getConfig: async () => {
            const response = await client.get('/config/');
            return response.data;
        },
        saveConfig: async (configData) => {
            const response = await client.put('/config/', configData);
            return response.data;
        },
        getModalities: async () => {
            const response = await client.get('/config/modalities');
            return response.data;
        },
        getWorkshops: async () => {
            const response = await client.get('/config/workshops');
            return response.data;
        },
        // --- Gallery Methods (Fix for GalleryManager) ---
        getGallery: async () => {
            // Check if endpoint exists, otherwise return mock empty array to allow UI to load
            try {
                const response = await client.get('/content/gallery');
                return response.data;
            } catch (e) {
                console.warn("Gallery endpoint not ready, returning empty list");
                return [];
            }
        },
        saveGallery: async (items) => {
            // Check if endpoint exists
            try {
                const response = await client.post('/content/gallery', items);
                return response.data;
            } catch (e) {
                console.warn("Gallery endpoint not ready (save)");
                return items;
            }
        },
        getNews: async () => { return []; },
        getHeroSlides: async () => { return []; },
        getSponsors: async () => { return []; },
        getSpecialties: async () => { return ["Medicina General", "Cardiología", "Neurología", "Pediatría"]; },
        getPrintConfig: async () => {
            const response = await client.get('/config/print-config');
            return response.data || { width: 9, height: 13, pageMargin: 1 };
        },
        savePrintConfig: async (config) => {
            const response = await client.put('/config/print-config', config);
            return response.data;
        }
    },

    academic: {
        getConfig: async () => {
            const response = await client.get('/academic/config');
            return response.data;
        },
        saveConfig: async (config) => {
            const response = await client.put('/academic/config', config);
            return response.data;
        },
        getRubrics: async (workType) => {
            const params = workType ? { work_type: workType } : {};
            const response = await client.get('/academic/rubrics', { params });
            return response.data;
        },
        createRubric: async (data) => {
            const response = await client.post('/academic/rubrics', data);
            return response.data;
        },
        updateRubric: async (id, data) => {
            const response = await client.put(`/academic/rubrics/${id}`, data);
            return response.data;
        },
        deleteRubric: async (id) => {
            const response = await client.delete(`/academic/rubrics/${id}`);
            return response.data;
        },
        assignJury: async (data) => {
            const response = await client.post('/academic/assign-jury', data);
            return response.data;
        },
        createJuror: async (data) => {
            const response = await client.post('/academic/jurors', data);
            return response.data;
        },
        createSpeaker: async (data) => {
            const response = await client.post('/academic/speakers', data);
            return response.data;
        },
        getJuries: async () => {
            const response = await client.get('/academic/users/jury');
            return response.data;
        },
        getSpeakers: async () => {
            const response = await client.get('/academic/users/speakers');
            return response.data;
        },
        getSpeakerLectures: async (speakerId) => {
            const response = await client.get(`/academic/speakers/${speakerId}/lectures`);
            return response.data;
        },
        createSpeakerLecture: async (speakerId, data) => {
            const response = await client.post(`/academic/speakers/${speakerId}/lectures`, data);
            return response.data;
        },
        deleteLecture: async (id) => {
            const response = await client.delete(`/academic/lectures/${id}`);
            return response.data;
        },
        getSettings: async () => {
            const response = await client.get('/academic/settings');
            return response.data;
        },
        updateSetting: async (key, value) => {
            const response = await client.put(`/academic/settings/${key}`, { key, value: String(value) });
            return response.data;
        },
        syncJuries: async (workId, juryIds) => {
            const response = await client.put(`/academic/works/${workId}/juries`, juryIds);
            return response.data;
        },
        scheduleWork: async (workId, data) => {
            const response = await client.post(`/academic/works/${workId}/schedule`, data);
            return response.data;
        },
        evaluateWork: async (assignmentId, evaluationData) => {
            const response = await client.post(`/academic/assignments/${assignmentId}/evaluate`, evaluationData);
            return response.data;
        }
    },
    // --- 7.5 Research (Expert Module) ---
    research: {
        getTypes: async () => {
            const response = await client.get('/research/config/types');
            return response.data;
        },
        createType: async (data) => {
            const response = await client.post('/research/config/types', data);
            return response.data;
        },
        updateType: async (id, data) => {
            const response = await client.put(`/research/config/types/${id}`, data);
            return response.data;
        },
        createSubmission: async (data) => {
            const response = await client.post('/research/submissions', data);
            return response.data;
        },
        getMySubmissions: async () => {
            const response = await client.get('/research/submissions/me');
            return response.data;
        },
        getSubmissions: async () => {
            const response = await client.get('/research/submissions');
            return response.data;
        },
        updateStatus: async (id, data) => {
            const response = await client.patch(`/research/submissions/${id}/status`, data);
            return response.data;
        },
        updateContent: async (id, data) => {
            const response = await client.put(`/research/submissions/${id}`, data);
            return response.data;
        },
        files: {
            upload: async (submissionId, file) => {
                const formData = new FormData();
                formData.append('submission_id', submissionId);
                formData.append('file', file);
                const response = await client.post('/research/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return response.data;
            },
            getBySubmission: async (submissionId) => {
                const response = await client.get(`/research/files/${submissionId}`);
                return response.data;
            },
            review: async (fileId, status, comment) => {
                const response = await client.put(`/research/files/${fileId}/review`, null, {
                    params: { status_val: status, comment }
                });
                return response.data;
            }
        }
    },
    works: {
        getAll: async (jurorId = null) => {
            const params = jurorId ? { juror_id: jurorId } : {};
            const response = await client.get('/academic/works', { params });
            return response.data;
        },
        getById: async (id) => {
            const response = await client.get(`/academic/works/${id}`);
            return response.data;
        },
        update: async (work) => {
            const response = await client.put(`/academic/works/${work.id}`, work);
            return response.data;
        },
        create: async (work) => {
            const response = await client.post('/academic/works', work);
            return response.data;
        },
        addEvaluation: async (workId, evaluation) => {
            const response = await client.post(`/academic/works/${workId}/evaluations`, evaluation);
            return response.data;
        }
    },

    // --- 8. Roles & Permissions ---
    roles: {
        getAll: async () => {
            const response = await client.get('/config/roles');
            return response.data;
        },
        create: async (role) => {
            const response = await client.post('/config/roles', role);
            return response.data;
        },
        update: async (roleId, data) => {
            const id = typeof roleId === 'object' ? roleId.id : roleId;
            const payload = typeof roleId === 'object' ? roleId : data;
            const response = await client.put(`/config/roles/${id}`, payload);
            return response.data;
        },
        delete: async (id) => {
            const response = await client.delete(`/config/roles/${id}`);
            return response.data;
        }
    },

    // --- 9. Courses ---
    courses: {
        getAll: async () => {
            const response = await client.get('/courses');
            return response.data;
        },
        getById: async (id) => {
            const response = await client.get(`/courses/${id}`);
            return response.data;
        },
        save: async (course) => {
            const method = course.id ? 'put' : 'post';
            const url = course.id ? `/courses/${course.id}` : '/courses';
            const response = await client[method](url, course);
            return response.data;
        },
        delete: async (id) => {
            const response = await client.delete(`/courses/${id}`);
            return response.data;
        }
    },

    // --- 9.5 Jurors ---
    jurors: {
        getAll: async () => {
            return await api.academic.getJuries();
        },
        create: async (data) => {
            return await api.academic.createJuror(data);
        }
    },

    // --- 10. Speakers ---
    speakers: {
        getAll: async () => {
            return await api.academic.getSpeakers();
        },
        create: async (data) => {
            return await api.academic.createSpeaker(data);
        },
        save: async (speaker) => {
            const method = speaker.id ? 'put' : 'post';
            const url = speaker.id ? `/speakers/${speaker.id}` : '/speakers';
            const response = await client[method](url, speaker);
            return response.data;
        }
    },

    // --- 11. Planning ---
    planning: {
        getParticipantOptions: async () => {
            const response = await client.get('/planning/participant-options');
            return response.data;
        },
        getMeetings: async () => {
            const response = await client.get('/planning/meetings');
            return response.data;
        },
        getMeeting: async (id) => {
            const response = await client.get(`/planning/meetings/${id}`);
            return response.data;
        },
        saveMeeting: async (meeting) => {
            const method = meeting.id ? 'put' : 'post';
            const url = meeting.id ? `/planning/meetings/${meeting.id}` : '/planning/meetings';
            const response = await client[method](url, meeting);
            return response.data;
        },
        deleteMeeting: async (id) => {
            const response = await client.delete(`/planning/meetings/${id}`);
            return response.data;
        },
        getTasks: async () => {
            const response = await client.get('/planning/tasks');
            return response.data;
        },
        saveTask: async (task) => {
            const method = task.id ? 'put' : 'post';
            const url = task.id ? `/planning/tasks/${task.id}` : '/planning/tasks';
            const response = await client[method](url, task);
            return response.data;
        },
        createTask: async (task) => {
            const response = await client.post('/planning/tasks', task);
            return response.data;
        },
        updateTaskProgress: async (taskId, progress, status, comment = null) => {
            const response = await client.patch(`/planning/tasks/${taskId}/progress`, { progress, status, comment });
            return response.data;
        },
        deleteTask: async (id) => {
            const response = await client.delete(`/planning/tasks/${id}`);
            return response.data;
        },
        startMeeting: (id) => client.post(`/planning/meetings/${id}/start`),
        checkIn: (id) => client.post(`/planning/meetings/${id}/check-in`),
        signActa: (id, password) => client.post(`/planning/meetings/${id}/sign`, { password }),
        // New attendance methods
        markAttendance: (meetingId) => client.post(`/planning/meetings/${meetingId}/mark-attendance`),
        rejectParticipant: (meetingId, userId) => client.put(`/planning/meetings/${meetingId}/participants/${userId}/reject`),
        justifyParticipant: (meetingId, userId, reason) => client.put(`/planning/meetings/${meetingId}/participants/${userId}/justify`, { reason }),
        terminateMeeting: (id) => client.post(`/planning/meetings/${id}/terminate`),
        closeActa: (id) => client.post(`/planning/meetings/${id}/close-act`),
        terminateMeeting: (id) => client.post(`/planning/meetings/${id}/terminate`),
        closeAct: (id) => client.post(`/planning/meetings/${id}/close-act`),
        markAttendance: (id) => client.post(`/planning/meetings/${id}/check-in`).then(res => res.data),
        updateAttendanceStatus: async (meetingId, userId, status) => {
            const response = await client.patch(`/planning/meetings/${meetingId}/attendance/${userId}`, { status });
            return response.data;
        },
        justifyAbsence: async (meetingId, userId, reason) => {
            const response = await client.post(`/planning/meetings/${meetingId}/attendance/${userId}/justify`, { reason });
            return response.data;
        },
        getMeetingParticipants: async (meetingId) => {
            const response = await client.get(`/planning/meetings/${meetingId}/attendance`);
            return response.data;
        },
        getMyTasks: () => client.get('/planning/my-tasks').then(res => res.data),
        downloadMeetingPDF: (meetingId) => {
            return client.get(`/planning/meetings/${meetingId}/pdf`, { responseType: 'blob' })
                .then((response) => {
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Acta_Reunion_${meetingId}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                });
        }
    },

    // --- 12. Dashboard ---
    dashboard: {
        getSummary: () => client.get('/dashboard/my-dashboard-summary').then(res => res.data),
    },

    // --- 13. Polls (Real-Time) ---
    polls: {
        list: (meetingId) => client.get(`/polls/meetings/${meetingId}`).then(res => res.data),
        create: (meetingId, data) => client.post(`/polls/meetings/${meetingId}`, data).then(res => res.data),
        delete: (pollId) => client.delete(`/polls/${pollId}`).then(res => res.data),
        launch: (pollId) => client.put(`/polls/${pollId}/launch`).then(res => res.data),
        close: (pollId) => client.put(`/polls/${pollId}/close`).then(res => res.data),
        vote: (pollId, optionId) => client.post(`/polls/${pollId}/vote`, { option_id: optionId }).then(res => res.data),
        getResults: (pollId) => client.get(`/polls/${pollId}/results`).then(res => res.data),
    },

    // --- 13. Attendance ---
    attendance: {
        record: async (userId, type, method = 'staff_scan') => {
            const response = await client.post('/logistics/attendance', { userId, type, method });
            return response.data;
        },
        getStats: async () => {
            return { total: 0, present: 0, absent: 0 };
        },
        getUserHistory: async (userId) => {
            const response = await client.get(`/logistics/attendance/user/${userId}`);
            return response.data;
        }
    },

    // --- 14. Treasury & Accounting ---
    // --- 14. Treasury & Accounting ---
    treasury: {
        getPricing: async () => {
            try {
                const response = await client.get('/accounting/pricing');
                return response.data;
            } catch (e) {
                return { ticketTypes: [], workshops: [] };
            }
        },
        getTransactions: async () => {
            const response = await client.get('/accounting/transactions');
            return response.data;
        },
        getTransactionsV2: async () => {
            const response = await client.get('/accounting/transactions');
            return response.data;
        },
        getAccounts: async () => {
            const response = await client.get('/treasury/config/accounts');
            return response.data;
        },
        getCategories: async () => {
            const response = await client.get('/treasury/config/categories');
            return response.data;
        },
        addTransactionV2: async (transaction) => {
            if (transaction instanceof FormData) {
                const response = await client.post('/accounting/transactions', transaction, {
                    headers: { 'Content-Type': null }
                });
                return response.data;
            }
            const response = await client.post('/accounting/transactions', transaction);
            return response.data;
        },
        addIncome: async (amount, description, category, voucherData = null, accountId = null) => {
            const accounts = await api.treasury.getAccounts();
            if (accounts.length === 0) throw new Error("No accounts available");
            const targetId = accountId || accounts[0].id;
            return await api.treasury.addTransactionV2({
                type: 'income',
                monto: parseFloat(amount),
                descripcion: description,
                categoria: category,
                cuenta_id: targetId,
                url_comprobante: voucherData
            });
        },
        getPendingRequests: async () => {
            const response = await client.get('/accounting/requests');
            return response.data;
        },
        approveRequest: async (requestId) => {
            const response = await client.post(`/accounting/requests/${requestId}/approve`);
            return response.data;
        },
        getConfig: async () => {
            const [accounts, categories] = await Promise.all([
                client.get('/treasury/config/accounts').then(r => r.data).catch(() => []),
                client.get('/treasury/config/categories').then(r => r.data).catch(() => [])
            ]);
            return { accounts, categories };
        },
        getStats: async () => {
            try {
                const response = await client.get('/accounting/stats');
                return response.data;
            } catch (e) {
                return { income: 0, expense: 0, balance: 0 };
            }
        },
        // Missing methods required by useTreasury
        getContributionPlan: async () => {
            const response = await client.get('/treasury/contributions');
            return response.data;
        },
        getBudgetPlan: async () => {
            const response = await client.get('/treasury/budget');
            return response.data;
        },
        getFines: async () => {
            const response = await client.get('/treasury/fines');
            return response.data;
        },
        // Write methods
        addAccount: async (data) => {
            const response = await client.post('/treasury/config/accounts', data);
            return response.data;
        },
        updateAccount: async (id, data) => {
            const response = await client.put(`/treasury/config/accounts/${id}`, data);
            return response.data;
        },
        deleteAccount: async (id) => {
            const response = await client.delete(`/treasury/config/accounts/${id}`);
            return response.data;
        },
        addCategory: async (type, name) => {
            const response = await client.post('/treasury/config/categories', { type, name });
            return response.data;
        },
        deleteCategory: async (type, name) => {
            const response = await client.delete(`/treasury/config/categories/${type}/${encodeURIComponent(name)}`);
            return response.data;
        },
        renameCategory: async (type, oldName, newName) => {
            const response = await client.put('/treasury/config/categories/rename', { type, oldName, newName });
            return response.data;
        },
        saveConfig: async (config) => {
            const response = await client.put('/treasury/config/settings', config);
            return response.data;
        },
        recordContribution: async (organizadorId, meses, accountId, amount, voucher, isValidation) => {
            const response = await client.post('/treasury/contributions/record', {
                organizadorId, meses, accountId, amount, voucher, isValidation
            });
            return response.data;
        },
        validateContribution: async (organizadorId, meses, accountId) => {
            const response = await client.post('/treasury/contributions/validate', { organizadorId, meses, accountId });
            return response.data;
        },
        rejectContribution: async (organizadorId, meses, reason) => {
            const response = await client.post('/treasury/contributions/reject', { organizadorId, meses, reason });
            return response.data;
        },
        updateBudgetCategory: async (category, amount) => {
            const response = await client.post('/treasury/budget', { category, amount });
            return response.data;
        },
        initializeContributionPlan: async () => {
            const response = await client.post('/treasury/contributions/init');
            return response.data;
        },
        updateFineStatus: async (fineId, status, data) => {
            const response = await client.put(`/treasury/fines/${fineId}`, { status, ...data });
            return response.data;
        },
        validateFine: async (fineId, accountId) => {
            const response = await client.post(`/treasury/fines/${fineId}/validate`, { accountId });
            return response.data;
        },
        validateVoucherV2: async (paymentId, approve, reason = null) => {
            // Accounting V2 endpoint
            const response = await client.post(`/accounting-v2/validate-voucher/${paymentId}`, { approve, reason });
            return response.data;
        },
        rejectFine: async (fineId, reason) => {
            const response = await client.post(`/treasury/fines/${fineId}/reject`, { reason });
            return response.data;
        },
        getBudgets: async () => {
            const response = await client.get('/treasury/budget');
            return response.data;
        },
        updateBudget: async (budgets) => {
            // Bulk update or individual
            // Assuming endpoint accepts list
            const response = await client.put('/treasury/budget', budgets);
            return response.data;
        },
        deleteTransactionV2: async (id) => {
            const response = await client.delete(`/accounting/transactions/${id}`);
            return response.data;
        },
        deleteTransaction: async (id) => {
            const response = await client.delete(`/accounting/transactions/${id}`);
            return response.data;
        },
        transfer: async (fromId, toId, amount, description) => {
            const response = await client.post('/treasury/transfer', { fromId, toId, amount, description });
            return response.data;
        }
    },

    // Alias object for useTreasury which expects separated config
    treasuryConfig: {
        getAccounts: async () => {
            return api.treasury.getAccounts();
        },
        getSettings: async () => {
            const response = await client.get('/treasury/config/settings');
            return response.data;
        },
        updateSettings: async (settings) => {
            const response = await client.put('/treasury/config/settings', { settings });
            return response.data;
        },
        getInstitutions: async () => {
            const response = await client.get('/treasury/config/institutions');
            return response.data;
        },
        addAccount: async (data) => {
            return api.treasury.addAccount(data);
        },
        createAccount: async (data) => {
            return api.treasury.addAccount(data);
        },
        updateAccount: async (id, data) => {
            return api.treasury.updateAccount(id, data);
        },
        deleteAccount: async (id) => {
            return api.treasury.deleteAccount(id);
        },
        deleteInstitution: async (id) => {
            const response = await client.delete(`/treasury/config/institutions/${id}`);
            return response.data;
        },
        getDestinations: async () => {
            const response = await client.get('/treasury/config/destinations');
            return response.data;
        },
        createInstitution: async (data) => {
            const response = await client.post('/treasury/config/institutions', data);
            return response.data;
        },
        updateInstitution: async (id, data) => {
            const response = await client.put(`/treasury/config/institutions/${id}`, data);
            return response.data;
        },
        uploadInstitutionLogo: async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await client.post('/treasury/config/institutions/upload-logo', formData, {
                headers: { 'Content-Type': null }
            });
            return response.data;
        }
    },

    // --- 14. Organizer Contributions (v2) ---
    organizerContributions: {
        getMatrix: async () => {
            const response = await client.get('/accounting-v2/dashboard-matrix', { params: { _t: Date.now() } });
            return response.data;
        },
        initializePlan: async (year = 2026) => {
            const response = await client.post('/accounting-v2/initialize-plan', null, { params: { year } });
            return response.data;
        },
        pay: async (paymentData) => {
            // Conversión a FormData para soporte de subida de archivos (voucher)
            const formData = new FormData();
            formData.append('user_id', paymentData.user_id);
            formData.append('contribution_ids', JSON.stringify(paymentData.contribution_ids || []));
            formData.append('penalty_ids', JSON.stringify(paymentData.penalty_ids || []));
            formData.append('amount', paymentData.amount);
            formData.append('method', paymentData.method || "TRANSFERENCIA");
            if (paymentData.target_account_id) {
                formData.append('target_account_id', paymentData.target_account_id);
            }

            if (paymentData.voucher instanceof File) {
                formData.append('voucher', paymentData.voucher);
            } else if (paymentData.voucher_url) {
                // Fallback for string URL if needed, although backend expects File
                formData.append('voucher_url', paymentData.voucher_url);
            }

            const response = await client.post('/accounting-v2/pay', formData, {
                headers: { 'Content-Type': null } // Importante para multipart
            });
            return response.data;
        },
        getConfig: async () => {
            const response = await client.get('/accounting-v2/config');
            return response.data;
        },
        saveConfig: async (config) => {
            const response = await client.post('/accounting-v2/config', config);
            return response.data;
        },
        validateVoucher: async (paymentId, approve, reason = null) => {
            const response = await client.post(`/accounting-v2/validate-voucher/${paymentId}`, { approve, reason });
            return response.data;
        },
        getStats: async () => {
            const response = await client.get('/accounting-v2/stats', { params: { _t: Date.now() } });
            return response.data;
        }
    },

    // --- 14.2 Accounting (Alias to Registrations for historical/recent) ---
    accounting: {
        getRecentApproved: (limit) => api.registrations.getRecentApproved(limit),
        getTransactionHistory: () => api.registrations.getTransactionHistory()
    },

    // --- 14.5 Attendees (Alias to Users with role filtering) ---
    attendees: {
        getAll: async () => {
            // Fetch users with 'asistente' role or similar
            const response = await client.get('/users');
            // Client side filter if backend doesn't support generic role filter in getAll
            if (Array.isArray(response.data)) {
                return response.data;
            }
            return response.data;
        },
        checkIn: async (id) => {
            const response = await client.post(`/logistics/attendance`, { userId: id, type: 'check-in' });
            return response.data;
        }
    },

    // --- 15. Authentication ---
    auth: {
        validateIdentity: async (step1Data) => {
            const response = await client.post('/auth/validate-identity', step1Data);
            return response.data;
        },
        login: async (credentials) => {
            const response = await authService.login(credentials);
            return response.user;
        },
        registerWithFile: async (formData) => {
            return authService.registerWithFile(formData);
        }
    },

    // --- 16. Roadmap ---
    roadmap: {
        getAll: async () => {
            const response = await client.get('/roadmap/');
            return response.data;
        },
        add: async (event) => {
            const response = await client.post('/roadmap/', event);
            return response.data;
        },
        update: async (event) => {
            const response = await client.put(`/roadmap/${event.id}`, event);
            return response.data;
        },
        async delete(id) {
            const response = await client.delete(`/roadmap/${id}`);
            return response.data;
        }
    },

    // --- 17. Coupons ---
    coupons: {
        getAll: async () => {
            const response = await client.get('/coupons');
            return response.data;
        },
        create: async (data) => {
            const response = await client.post('/coupons', data);
            return response.data;
        },
        update: async (id, data) => {
            const response = await client.put(`/coupons/${id}`, data);
            return response.data;
        },
        delete: async (id) => {
            const response = await client.delete(`/coupons/${id}`);
            return response.data;
        },
        validate: async (code) => {
            const response = await client.post('/coupons/validate', { code });
            return response.data;
        },
        redeem: async (code) => {
            const response = await client.post('/coupons/redeem', { code });
            return response.data;
        },
        getUsages: async () => {
            const response = await client.get('/coupons/usages');
            return response.data;
        },
        getHistory: async (id) => {
            const response = await client.get(`/coupons/${id}/history`);
            return response.data;
        }
    },

    // --- 14. Document Management (Google Drive) ---
    documents: {
        list: async (folderId) => {
            const params = folderId ? { folder_id: folderId } : {};
            const res = await client.get('/documents/list', { params });
            return res.data;
        },
        createFolder: async (name, parentId) => {
            const res = await client.post('/documents/folder', { name, parent_id: parentId });
            return res.data;
        },
        upload: async (file, parentId) => {
            const formData = new FormData();
            formData.append('file', file);
            if (parentId) formData.append('parent_id', parentId);
            const res = await client.post('/documents/upload', formData, {
                headers: { 'Content-Type': null }
            });
            return res.data;
        },
        delete: async (fileId) => {
            const res = await client.delete(`/documents/${fileId}`);
            return res.data;
        }
    }
};

export default api;
