/**
 * External Service
 * Handles calls to third-party APIs (e.g., OSRM, maps, etc.)
 * to ensure no direct fetch calls exist outside of the service layer.
 */

export const ExternalService = {
	/**
	 * Get walking route between two points using OSRM
	 */
	async getWalkingRoute(start: [number, number], end: [number, number]): Promise<any> {
		const url = `https://router.project-osrm.org/route/v1/walking/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error('Failed to fetch route from OSRM');
		}
		return await res.json();
	}
};
