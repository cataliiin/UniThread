<script lang="ts">
	import { onMount, mount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import {
		campusBuildings,
		BRASOV_CENTER,
		getDirectionsUrl,
		haversineDistance,
		type CampusBuilding
	} from '$lib/map-data/campusBuildings';
	import MapSidebar from './map/MapSidebar.svelte';
	import MapMarker from './map/MapMarker.svelte';

	import { themeState } from '$lib/stores/theme.svelte';

	let mapContainer: HTMLDivElement;
	let map: any = $state(null);
	let L: any = $state(null);
	let tileLayer: any = null;

	let selectedBuilding = $state<CampusBuilding | null>(null);
	let userLocation = $state<{ lat: number; lng: number } | null>(null);
	let locationError = $state('');
	let sidebarOpen = $state(true);
	let markers = $state<Map<string, any>>(new Map());

	const categoryColors = $derived.by(() => {
		const theme = themeState.current;
		
		// Base colors
		const colors = {
			academic: '#32415f',
			administrative: '#6b21a8',
			library: '#b45309',
			campus: '#047857'
		};

		if (theme === 'cyberpunk') {
			colors.academic = '#00ffc2';
			colors.administrative = '#ff003c';
			colors.campus = '#dfff00';
		} else if (theme === 'midnight') {
			colors.academic = '#3f3f46';
			colors.administrative = '#ff0000';
			colors.campus = '#18181b';
		} else if (theme === 'outpost') {
			colors.academic = '#a54a26'; // Rust
			colors.administrative = '#f5c71a'; // Industrial Yellow
			colors.campus = '#333333'; // Gunmetal
		} else if (theme === 'amethyst' || theme === 'cyberpop') {
			colors.academic = '#c084fc';
			colors.administrative = '#ff007f';
		} else if (theme === 'coffee') {
			colors.academic = '#c68642';
			colors.administrative = '#4a3429';
		} else if (theme === 'sakura') {
			colors.academic = '#ffb7c5';
			colors.administrative = '#dcae96';
		}

		return colors;
	});

	const categoryLabels: Record<string, string> = {
		academic: 'Academic',
		administrative: 'Administrative',
		library: 'Library',
		campus: 'Campus'
	};

	function createCustomIcon(leaflet: any, building: CampusBuilding) {
		const container = document.createElement('div');
		const color = categoryColors[building.category] || '#32415f';

		// Mount the MapMarker component into a temporary container
		mount(MapMarker, {
			target: container,
			props: { shortName: building.shortName, color }
		});

		return leaflet.divIcon({
			className: 'custom-marker',
			html: container.firstChild, // Use the actual element produced by Svelte
			iconSize: [40, 40],
			iconAnchor: [20, 40],
			popupAnchor: [0, -40]
		});
	}

	function createPopupContent(building: CampusBuilding): string {
		const facList = building.faculties.length
			? building.faculties.map((f) => `<li>${f}</li>`).join('')
			: '<li class="no-fac text-muted-foreground italic">No associated faculties</li>';

		const dist = userLocation
			? `<div class="popup-distance text-blue-400 font-medium mb-2">Distance: ~${haversineDistance(userLocation.lat, userLocation.lng, building.lat, building.lng).toFixed(2)} km away</div>`
			: '';

		// Using Tailwind in popups (requires global styles or string-based classes that match Tailwind)
		return `
			<div class="campus-popup p-1">
				<h3 class="text-base font-bold text-foreground mb-2">${building.name}</h3>
				<div class="text-xs text-muted-foreground mb-2">Address: ${building.address}</div>
				${building.description ? `<p class="text-xs text-muted-foreground/80 leading-relaxed mb-3">${building.description}</p>` : ''}
				<div class="mb-3">
					<span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style="background:${categoryColors[building.category]}">
						${categoryLabels[building.category]}
					</span>
				</div>
				<ul class="space-y-1 mb-4 border-t border-sidebar-border pt-2">
					${facList.replace(/<li>/g, '<li class="text-xs text-foreground/90 border-b border-sidebar-border/50 py-1 last:border-0">')}
				</ul>
				${dist}
				<a href="${getDirectionsUrl(building)}" target="_blank" rel="noopener noreferrer" 
				   class="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all">
					Directions via Google Maps
				</a>
			</div>
		`;
	}

	function flyToBuilding(building: CampusBuilding) {
		if (!map) return;
		selectedBuilding = building;
		map.flyTo([building.lat, building.lng], 17, { duration: 1.2 });
		const marker = markers.get(building.id);
		if (marker) {
			setTimeout(() => marker.openPopup(), 600);
		}
		if (window.innerWidth < 1024) sidebarOpen = false;
	}

	function locateUser() {
		if (!browser || !navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser.';
			return;
		}
		locationError = '';
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				if (map && L) {
					map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1 });
				}
			},
			(err) => {
				locationError =
					err.code === 1 ? 'Location access denied.' : 'Unable to determine your location.';
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	function resetView() {
		if (map) {
			map.flyTo([BRASOV_CENTER.lat, BRASOV_CENTER.lng], 14, { duration: 1 });
			selectedBuilding = null;
		}
	}

	onMount(async () => {
		if (!browser) return;

		const leaflet = await import('leaflet');
		L = leaflet.default || leaflet;

		map = L.map(mapContainer, {
			center: [BRASOV_CENTER.lat, BRASOV_CENTER.lng],
			zoom: 14,
			zoomControl: false,
			attributionControl: true
		});

		L.control.zoom({ position: 'bottomright' }).addTo(map);

		// Initialize markers
		updateMarkers();

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				},
				() => {},
				{ enableHighAccuracy: true, timeout: 5000 }
			);
		}

		return () => {
			if (map) {
				map.remove();
				map = null;
			}
		};
	});

	function updateMarkers() {
		if (!map || !L) return;
		
		// Clear existing markers
		markers.forEach(m => map.removeLayer(m));
		const newMarkers = new Map<string, any>();
		
		for (const building of campusBuildings) {
			const icon = createCustomIcon(L, building);
			const marker = L.marker([building.lat, building.lng], { icon })
				.addTo(map)
				.bindPopup(createPopupContent(building), {
					maxWidth: 300,
					className: 'campus-popup-wrapper'
				});
			marker.on('click', () => {
				selectedBuilding = building;
			});
			newMarkers.set(building.id, marker);
		}
		markers = newMarkers;
	}

	// Reactive Tile Layer & Filter
	$effect(() => {
		if (!map || !L) return;

		const theme = themeState.current;
		const isDark = ['dark', 'midnight', 'forest', 'amethyst', 'cyberpunk', 'coffee', 'cyberpop'].includes(theme);
		const tileUrl = isDark 
			? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
			: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

		if (tileLayer) map.removeLayer(tileLayer);
		
		tileLayer = L.tileLayer(tileUrl, {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		}).addTo(map);

		// Re-render markers when theme (and category colors) change
		untrack(() => updateMarkers());
	});

	let userMarker: any = null;
	$effect(() => {
		if (!map || !L || !userLocation) return;
		if (userMarker) {
			userMarker.setLatLng([userLocation.lat, userLocation.lng]);
		} else {
			const userIcon = L.divIcon({
				className: 'user-location-marker',
				html: '<div class="relative w-4 h-4 bg-blue-500 border-[3px] border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"><div class="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping-slow"></div></div>',
				iconSize: [16, 16],
				iconAnchor: [8, 8]
			});
			userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
				.addTo(map)
				.bindPopup('<div class="text-sm font-bold text-foreground">You are here</div>');
		}
	});

	let routeLayer: any = null;
	$effect(() => {
		if (!map || !L || !userLocation || !selectedBuilding) {
			if (routeLayer) {
				map.removeLayer(routeLayer);
				routeLayer = null;
			}
			return;
		}

		const start = [userLocation.lng, userLocation.lat];
		const end = [selectedBuilding.lng, selectedBuilding.lat];
		const url = `https://router.project-osrm.org/route/v1/walking/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

		fetch(url)
			.then((res) => res.json())
			.then((data) => {
				if (data.routes && data.routes.length > 0) {
					if (routeLayer) map.removeLayer(routeLayer);

					const geojson = data.routes[0].geometry;
					
					// Main path
					const mainPath = L.geoJSON(geojson, {
						style: {
							color: '#3b82f6',
							weight: 5,
							opacity: 0.8,
							lineCap: 'round',
							lineJoin: 'round',
							dashArray: '1, 12'
						}
					});

					// Glow effect
					const glowPath = L.geoJSON(geojson, {
						style: {
							color: '#3b82f6',
							weight: 10,
							opacity: 0.2,
							lineCap: 'round',
							lineJoin: 'round'
						}
					});

					routeLayer = L.layerGroup([glowPath, mainPath]).addTo(map);
				}
			})
			.catch((err) => console.error('Routing error:', err));
	});
</script>

<div class="relative flex w-full h-full min-h-[calc(100vh-80px)] overflow-hidden bg-background">
	<MapSidebar
		bind:sidebarOpen
		bind:selectedBuilding
		{userLocation}
		{locationError}
		onlocate={locateUser}
		onreset={resetView}
		onflyto={flyToBuilding}
	/>

	{#if !sidebarOpen}
		<button 
			class="absolute top-4 left-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar/90 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-sidebar" 
			onclick={() => (sidebarOpen = true)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="3" x2="21" y1="6" y2="6"></line>
				<line x1="3" x2="21" y1="12" y2="12"></line>
				<line x1="3" x2="21" y1="18" y2="18"></line>
			</svg>
		</button>
	{/if}

	<div class="flex-1 min-h-full z-[1]" bind:this={mapContainer}></div>
</div>

<style>
	/* Leaflet Global Overrides */
	:global(.custom-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.user-location-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.animate-ping-slow) {
		animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	/* Popup Overrides to match theme */
	:global(.campus-popup-wrapper .leaflet-popup-content-wrapper) {
		background: var(--card) !important;
		border: 1px solid var(--border) !important;
		border-radius: 16px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
		color: var(--card-foreground) !important;
		padding: 4px;
	}

	:global(.campus-popup-wrapper .leaflet-popup-tip) {
		background: var(--card) !important;
		border: 1px solid var(--border) !important;
	}

	:global(.campus-popup-wrapper .leaflet-popup-close-button) {
		color: var(--muted-foreground) !important;
		padding: 8px !important;
	}

	:global(.campus-popup-wrapper .leaflet-popup-close-button:hover) {
		color: var(--foreground) !important;
	}
</style>
