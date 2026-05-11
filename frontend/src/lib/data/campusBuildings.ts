/**
 * Campus Buildings Data — Universitatea Transilvania din Brașov
 *
 * Each entry contains GPS coordinates, address, and faculties
 * associated with a university building. To correct a location,
 * simply modify the `lat` and `lng` values.
 */

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
	// ── Administrative ──────────────────────────────────────────────────
	{
		id: 'rectorat',
		name: 'Rectorat — Main Headquarters',
		shortName: 'Rectorat',
		address: 'Bd. Eroilor nr. 29, Brașov',
		lat: 45.6427,
		lng: 25.5886,
		faculties: ['Rectorat', 'Administration'],
		description: 'Main headquarters of Transilvania University of Brașov.',
		category: 'administrative'
	},

	// ── Colina Universității (zona principală) ──────────────────────────
	{
		id: 'corp-a',
		name: 'Corp A',
		shortName: 'A',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6555,
		lng: 25.5964,
		faculties: ['Facultatea de Științe Economice și Administrarea Afacerilor'],
		category: 'academic'
	},
	{
		id: 'corp-b',
		name: 'Corp B',
		shortName: 'B',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6551,
		lng: 25.5970,
		faculties: ['Facultatea de Inginerie Electrică și Știința Calculatoarelor'],
		category: 'academic'
	},
	{
		id: 'corp-c',
		name: 'Corp C',
		shortName: 'C',
		address: 'Str. Politehnicii nr. 1, Brașov',
		lat: 45.6549,
		lng: 25.5953,
		faculties: ['Facultatea de Inginerie Mecanică'],
		category: 'academic'
	},
	{
		id: 'corp-d',
		name: 'Corp D',
		shortName: 'D',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6547,
		lng: 25.5979,
		faculties: ['Facultatea de Inginerie Tehnologică și Management Industrial'],
		category: 'academic'
	},
	{
		id: 'corp-e',
		name: 'Corp E',
		shortName: 'E',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6543,
		lng: 25.5973,
		faculties: ['Facultatea de Știința și Ingineria Materialelor'],
		category: 'academic'
	},
	{
		id: 'corp-f',
		name: 'Corp F',
		shortName: 'F',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6559,
		lng: 25.5958,
		faculties: ['Facultatea de Design de Produs și Mediu'],
		category: 'academic'
	},
	{
		id: 'corp-ia',
		name: 'Corp IA',
		shortName: 'IA',
		address: 'Str. Colina Universității, Brașov',
		lat: 45.6540,
		lng: 25.5960,
		faculties: ['Institutul de Cercetare-Dezvoltare (ICDT)'],
		description: 'Modern building dedicated to research.',
		category: 'academic'
	},
	{
		id: 'corp-p',
		name: 'Corp P',
		shortName: 'P',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6560,
		lng: 25.5972,
		faculties: ['Facultatea de Alimentație și Turism'],
		category: 'academic'
	},
	{
		id: 'corp-r',
		name: 'Corp R',
		shortName: 'R',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6562,
		lng: 25.5967,
		faculties: ['Facultatea de Educație Fizică și Sport Montane'],
		category: 'academic'
	},
	{
		id: 'corp-t',
		name: 'Corp T',
		shortName: 'T',
		address: 'Str. Politehnicii nr. 1, Brașov',
		lat: 45.6546,
		lng: 25.5946,
		faculties: ['Facultatea de Inginerie Mecanică'],
		description: 'Additional building for laboratories.',
		category: 'academic'
	},

	// ── Zona Centrală ───────────────────────────────────────────────────
	{
		id: 'corp-l',
		name: 'Corp L',
		shortName: 'L',
		address: 'Bd. Eroilor nr. 25, Brașov',
		lat: 45.6430,
		lng: 25.5879,
		faculties: ['Facultatea de Litere', 'Facultatea de Sociologie și Comunicare'],
		category: 'academic'
	},
	{
		id: 'corp-m',
		name: 'Corp M',
		shortName: 'M',
		address: 'Bd. Eroilor nr. 29, Brașov',
		lat: 45.6427,
		lng: 25.5893,
		faculties: ['Facultatea de Matematică și Informatică'],
		category: 'academic'
	},
	{
		id: 'corp-n',
		name: 'Corp N',
		shortName: 'N',
		address: 'Str. Nicolae Bălcescu nr. 56, Brașov',
		lat: 45.6418,
		lng: 25.5867,
		faculties: ['Facultatea de Psihologie și Științele Educației'],
		category: 'academic'
	},
	{
		id: 'corp-v',
		name: 'Corp V',
		shortName: 'V',
		address: 'Str. Mihai Viteazu nr. 5, Brașov',
		lat: 45.6493,
		lng: 25.5906,
		faculties: ['Facultatea de Drept'],
		category: 'academic'
	},
	{
		id: 'corp-x',
		name: 'Corp X',
		shortName: 'X',
		address: 'Str. Turnului nr. 5, Brașov',
		lat: 45.6473,
		lng: 25.5911,
		faculties: ['Facultatea de Silvicultură și Exploatări Forestiere'],
		category: 'academic'
	},
	{
		id: 'corp-z',
		name: 'Corp Z — Music',
		shortName: 'Z',
		address: 'Str. Andrei Șaguna nr. 2, Brașov',
		lat: 45.6431,
		lng: 25.5929,
		faculties: ['Facultatea de Muzică'],
		category: 'academic'
	},

	// ── Bibliotecă ──────────────────────────────────────────────────────
	{
		id: 'biblioteca',
		name: 'Biblioteca Centrală Universitară',
		shortName: 'BCU',
		address: 'Str. Universității nr. 1, Brașov',
		lat: 45.6553,
		lng: 25.5975,
		faculties: [],
		description: 'Central Library of Transilvania University.',
		category: 'library'
	}
];

/**
 * Returns a Google Maps URL with directions to a university building.
 */
export function getDirectionsUrl(building: CampusBuilding): string {
	return `https://www.google.com/maps/dir/?api=1&destination=${building.lat},${building.lng}&travelmode=walking`;
}

/**
 * Calculates the distance (in km) between two coordinates using the Haversine formula.
 */
export function haversineDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	const R = 6371; // Earth radius in km
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
