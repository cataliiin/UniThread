export interface CampusBuilding {
	id: string;
	name: string;
	shortName: string;
	address: string;
	lat: number;
	lng: number;
	faculties: string[];
	description?: string;
	category: 'academic' | 'administrative' | 'library' | 'campus';
}

export const BRASOV_CENTER = {
	lat: 45.6486,
	lng: 25.5925
} as const;

export const campusBuildings: CampusBuilding[] = [
	{
		id: 'rectorat',
		name: 'Rectorat',
		shortName: 'Rec',
		address: 'Bd. Eroilor nr. 29, Brașov',
		lat: 45.6453483,
		lng: 25.5891618,
		faculties: ['Rectorat', 'Administration'],
		description: 'Main headquarters of Transilvania University of Brașov.',
		category: 'administrative'
	},
	{
		id: 'corp-a',
		name: 'Corp A',
		shortName: 'A',
		address: 'Strada Universității 1, Brașov',
		lat: 45.6537435,
		lng: 25.5978548,
		faculties: [
			'Facultatea de Inginerie Tehnologică și Management Industrial',
			'Facultatea de Știința și Ingineria Materialelor'
		],
		category: 'academic'
	},
	{
		id: 'corp-c',
		name: 'Corp C',
		shortName: 'C',
		address: 'Strada Universității 1, Brașov',
		lat: 45.6547625,
		lng: 25.597683,
		faculties: ['Facultatea de Științe Economice și Administrarea Afacerilor'],
		category: 'academic'
	},
	{
		id: 'corp-d',
		name: 'Corp D',
		shortName: 'D',
		address: 'Strada Universității 1, Brașov',
		lat: 45.6547993,
		lng: 25.5975705,
		faculties: ['Facultatea de Design de Produs și Mediu'],
		category: 'academic'
	},
	{
		id: 'corp-g',
		name: 'Corp G',
		shortName: 'G',
		address: 'Strada Universității 1, Brașov',
		lat: 45.6544198,
		lng: 25.5966542,
		faculties: ['Facultatea de Inginerie Mecanică'],
		category: 'academic'
	},
	{
		id: 'corp-n',
		name: 'Corp N',
		shortName: 'N',
		address: 'Strada Politehnicii 1, Brașov',
		lat: 45.6441808,
		lng: 25.5950782,
		faculties: ['Facultatea de Inginerie Electrică și Știința Calculatoarelor'],
		category: 'academic'
	},
	{
		id: 'corp-v',
		name: 'Corp V',
		shortName: 'V',
		address: 'Strada Mihai Viteazul 5, Brașov',
		lat: 45.6555777,
		lng: 25.5990239,
		faculties: ['Facultatea de Inginerie Tehnologică și Management Industrial'],
		category: 'academic'
	},
	{
		id: 'corp-l',
		name: 'Corp L',
		shortName: 'L',
		address: 'Strada Universității 1, Brașov',
		lat: 45.6539819,
		lng: 25.5967364,
		faculties: ['Facultatea de Design de Mobilier și Ingineria Lemnului'],
		category: 'academic'
	},
	{
		id: 'corp-s',
		name: 'Facultatea de Silvicultură',
		shortName: 'S',
		address: 'Strada Șirul Beethoven 1, Brașov',
		lat: 45.6399142,
		lng: 25.5857113,
		faculties: ['Facultatea de Silvicultură și Exploatări Forestiere'],
		category: 'academic'
	},
	{
		id: 'corp-t',
		name: 'Corp T',
		shortName: 'T',
		address: 'Bulevardul Eroilor 25, Brașov',
		lat: 45.6447509,
		lng: 25.5927081,
		faculties: [
			'Facultatea de Litere',
			'Facultatea de Drept',
			'Facultatea de Sociologie și Comunicare'
		],
		category: 'academic'
	},
	{
		id: 'corp-f',
		name: 'Corp F',
		shortName: 'F',
		address: 'Strada Universității 1, Brașov',
		lat: 45.6549196,
		lng: 25.5965467,
		faculties: ['Facultatea de Educație Fizică și Sporturi Montane'],
		category: 'academic'
	},
	{
		id: 'corp-r',
		name: 'Corp R',
		shortName: 'R',
		address: 'Strada Castelului 148, Brașov',
		lat: 45.6428612,
		lng: 25.5971709,
		faculties: ['Facultatea de Alimentație și Turism'],
		category: 'academic'
	},
	{
		id: 'corp-j',
		name: 'Corp J',
		shortName: 'J',
		address: 'Strada Turnului 5, Brașov',
		lat: 45.6631483,
		lng: 25.619571,
		faculties: ['Facultatea de Construcții'],
		category: 'academic'
	},
	{
		id: 'corp-p',
		name: 'Corp P',
		shortName: 'P',
		address: 'Strada Iuliu Maniu 50, Brașov',
		lat: 45.6492665,
		lng: 25.6015075,
		faculties: ['Facultatea de Matematică și Informatică'],
		category: 'academic'
	},
	{
		id: 'corp-k',
		name: 'Corp K',
		shortName: 'K',
		address: 'Strada Nicolae Bălcescu 56, Brașov',
		lat: 45.6427623,
		lng: 25.5956855,
		faculties: [
			'Facultatea de Medicină',
			'Facultatea de Psihologie și Științele Educației'
		],
		category: 'academic'
	},
	{
		id: 'corp-z',
		name: 'Corp Z',
		shortName: 'Z',
		address: 'Şirul Mitropolit Andrei Şaguna 2, Brașov',
		lat: 45.6387456,
		lng: 25.5835203,
		faculties: ['Facultatea de Muzică'],
		category: 'academic'
	},
	{
		id: 'biblioteca',
		name: 'Biblioteca Centrală Universitară',
		shortName: 'BCU',
		address: 'Strada Universității 1, Brașov',
		lat: 45.6553,
		lng: 25.5975,
		faculties: [],
		description: 'Central Library of Transilvania University.',
		category: 'library'
	},
	{
		id: 'aula',
		name: 'Aula Sergiu Chiriacescu',
		shortName: 'Aula',
		address: 'Strada Iuliu Maniu 41A, Brașov',
		lat: 45.6510129,
		lng: 25.6028861,
		faculties: [],
		description: 'The University Aula used for large events and conferences.',
		category: 'campus'
	},
	{
		id: 'cantina-memo',
		name: 'Cantina Memorandului',
		shortName: 'Memo',
		address: 'Strada Memorandului 38, Brașov',
		lat: 45.6549868,
		lng: 25.58143,
		faculties: [],
		description: 'Student cafeteria located in the Memorandului campus.',
		category: 'campus'
	}
];

export function getDirectionsUrl(building: CampusBuilding): string {
	return `https://www.google.com/maps/dir/?api=1&destination=${building.lat},${building.lng}&travelmode=walking`;
}

export function haversineDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}
