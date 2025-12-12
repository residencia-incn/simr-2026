export const MOCK_USERS = [
    { id: 'u1', name: 'Dr. Alejandro Rabinstein', email: 'rabinstein@mayo.edu', institution: 'Mayo Clinic', roles: ['jury', 'participant'], role: 'Jurado' },
    { id: 'u2', name: 'Dr. Luis Trujillo', email: 'ltrujillo@incn.gob.pe', institution: 'INCN', roles: ['resident', 'participant', 'academic'], role: 'Residente' },
    { id: 'u3', name: 'Dra. Carmen Betancur', email: 'cbetancur@incn.gob.pe', institution: 'INCN', roles: ['participant'], role: 'Aula Virtual' },
    { id: 'u4', name: 'Dr. Henderson Vasquez', email: 'hvasquez@incn.gob.pe', institution: 'INCN', roles: ['resident', 'participant'], role: 'Residente' },
    { id: 'u5', name: 'Dr. Carlos Gutierrez', email: 'cgutierrez@incn.gob.pe', institution: 'INCN', roles: ['resident', 'participant'], role: 'Residente' },
    { id: 'u6', name: 'Dra. Luciana Jara', email: 'ljara@incn.gob.pe', institution: 'UNMSM', roles: ['resident', 'participant'], role: 'Residente' },
    { id: 'u7', name: 'Dr. Daniel Ospina', email: 'dospina@incn.gob.pe', institution: 'UPCH', roles: ['resident', 'participant'], role: 'Residente' },
    { id: 'u8', name: 'Dr. Juan Pérez', email: 'jperez@gmail.com', institution: 'HNDAC', roles: ['resident', 'participant', 'treasurer'], role: 'Residente' },
    { id: 'u9', name: 'Dra. María López', email: 'mlopez@gmail.com', institution: 'Hosp. Almenara', roles: ['participant'], role: 'Aula Virtual' },
    { id: 'u10', name: 'Dr. Julio García', email: 'jgarcia@gmail.com', institution: 'Hosp. Rebagliati', roles: ['participant'], role: 'Aula Virtual' },

    // Test Users for Planning Module
    {
        id: 'u_academic',
        name: 'Dr. Pedro Castillo',
        email: 'academico',
        password: 'academico',
        institution: 'INCN',
        roles: ['academic', 'participant'],
        role: 'academic'
    },
    {
        id: 'u_treasurer',
        name: 'Dra. Ana Torres',
        email: 'tesorero',
        password: 'tesorero',
        institution: 'INCN',
        roles: ['treasurer', 'participant'],
        role: 'treasurer'
    },

    // Default Super User with ALL roles
    {
        id: 'u999',
        name: 'Super Usuario',
        email: 'admin', // Simple login 
        password: 'admin',
        institution: 'Sistema',
        roles: ['admin', 'academic', 'jury', 'resident', 'participant', 'treasurer', 'admission'],
        role: 'admin'
    }
];
