<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		campusBuildings,
		BRASOV_CENTER,
		getDirectionsUrl,
		haversineDistance,
		type CampusBuilding
	} from '$lib/data/campusBuildings';

	let mapContainer: HTMLDivElement;
	let map: any = $state(null);
	let L: any = $state(null);

	let searchQuery = $state('');
	let selectedBuilding = $state<CampusBuilding | null>(null);
	let userLocation = $state<{ lat: number; lng: number } | null>(null);
	let locationError = $state('');
	let sidebarOpen = $state(true);
	let markers = $state<Map<string, any>>(new Map());

	let filteredBuildings = $derived(
		campusBuildings.filter(
			(b) =>
				b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.faculties.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	const categoryColors: Record<string, string> = {
		academic: '#32415f',
		administrative: '#6b21a8',
		library: '#b45309',
		campus: '#047857'
	};

	const categoryLabels: Record<string, string> = {
		academic: 'Academic',
		administrative: 'Administrative',
		library: 'Library',
		campus: 'Campus'
	};

	function createCustomIcon(leaflet: any, building: CampusBuilding) {
		const color = categoryColors[building.category] || '#32415f';
		return leaflet.divIcon({
			className: 'custom-marker',
			html: `<div class="marker-pin" style="background:${color}"><span>${building.shortName}</span></div>`,
			iconSize: [40, 50],
			iconAnchor: [20, 50],
			popupAnchor: [0, -50]
		});
	}

	function createPopupContent(building: CampusBuilding): string {
		const facList = building.faculties.length
			? building.faculties.map((f) => `<li>${f}</li>`).join('')
			: '<li class="no-fac">No associated faculties</li>';

		const dist =
			userLocation
				? `<div class="popup-distance">📍 ~${haversineDistance(userLocation.lat, userLocation.lng, building.lat, building.lng).toFixed(2)} km away</div>`
				: '';

		return `
			<div class="campus-popup">
				<h3>${building.name}</h3>
				<div class="popup-address">📌 ${building.address}</div>
				${building.description ? `<p class="popup-desc">${building.description}</p>` : ''}
				<div class="popup-category">
					<span class="cat-badge" style="background:${categoryColors[building.category]}">${categoryLabels[building.category]}</span>
				</div>
				<ul class="popup-faculties">${facList}</ul>
				${dist}
				<a href="${getDirectionsUrl(building)}" target="_blank" rel="noopener noreferrer" class="popup-directions">
					🧭 Directions via Google Maps
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
					err.code === 1
						? 'Location access denied.'
						: 'Unable to determine your location.';
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
		await import('leaflet/dist/leaflet.css');
		L = leaflet.default || leaflet;

		map = L.map(mapContainer, {
			center: [BRASOV_CENTER.lat, BRASOV_CENTER.lng],
			zoom: 14,
			zoomControl: false,
			attributionControl: true
		});

		L.control.zoom({ position: 'bottomright' }).addTo(map);

		// Dark-mode tile layer
		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		}).addTo(map);

		// Add building markers
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

		// Try geolocation on mount
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				},
				() => { /* silently fail */ },
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

	// Reactively add/update user location marker
	let userMarker: any = null;
	$effect(() => {
		if (!map || !L || !userLocation) return;
		if (userMarker) {
			userMarker.setLatLng([userLocation.lat, userLocation.lng]);
		} else {
			const userIcon = L.divIcon({
				className: 'user-location-marker',
				html: '<div class="user-dot"><div class="user-dot-pulse"></div></div>',
				iconSize: [24, 24],
				iconAnchor: [12, 12]
			});
			userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
				.addTo(map)
				.bindPopup('<div class="campus-popup"><h3>📍 You are here</h3></div>');
		}
	});
</script>

<div class="map-wrapper">
	<!-- Sidebar -->
	<aside class="map-sidebar {sidebarOpen ? 'open' : 'closed'}">
		<div class="sidebar-header">
			<h2>UNITBV Buildings</h2>
			<button class="toggle-btn" onclick={() => (sidebarOpen = !sidebarOpen)} title="Toggle sidebar">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					{#if sidebarOpen}
						<polyline points="15 18 9 12 15 6"></polyline>
					{:else}
						<polyline points="9 18 15 12 9 6"></polyline>
					{/if}
				</svg>
			</button>
		</div>

		{#if sidebarOpen}
			<div class="sidebar-content">
				<!-- Search -->
				<div class="search-box">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" x2="16.65" y1="21" y2="16.65"></line>
					</svg>
					<input
						type="text"
						placeholder="Search building, faculty..."
						bind:value={searchQuery}
					/>
				</div>

				<!-- Action buttons -->
				<div class="action-buttons">
					<button class="action-btn locate" onclick={locateUser}>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="3"></circle>
							<path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path>
						</svg>
						My Location
					</button>
					<button class="action-btn reset" onclick={resetView}>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
							<path d="M3 3v5h5"></path>
						</svg>
						Reset
					</button>
				</div>

				{#if locationError}
					<div class="location-error">{locationError}</div>
				{/if}

				<!-- Buildings list -->
				<div class="buildings-list">
					{#each filteredBuildings as building (building.id)}
						<button
							class="building-card {selectedBuilding?.id === building.id ? 'active' : ''}"
							onclick={() => flyToBuilding(building)}
						>
							<div class="building-badge" style="background:{categoryColors[building.category]}">
								{building.shortName}
							</div>
							<div class="building-info">
								<span class="building-name">{building.name}</span>
								<span class="building-address">{building.address}</span>
								{#if userLocation}
									<span class="building-dist">
										~{haversineDistance(userLocation.lat, userLocation.lng, building.lat, building.lng).toFixed(2)} km
									</span>
								{/if}
							</div>
							<svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="9 18 15 12 9 6"></polyline>
							</svg>
						</button>
					{:else}
						<div class="no-results">No results for "{searchQuery}"</div>
					{/each}
				</div>
			</div>
		{/if}
	</aside>

	<!-- Mobile toggle -->
	{#if !sidebarOpen}
		<button class="mobile-sidebar-toggle" onclick={() => (sidebarOpen = true)}>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="3" x2="21" y1="6" y2="6"></line>
				<line x1="3" x2="21" y1="12" y2="12"></line>
				<line x1="3" x2="21" y1="18" y2="18"></line>
			</svg>
		</button>
	{/if}

	<!-- Map container -->
	<div class="map-container" bind:this={mapContainer}></div>
</div>

<style>
	/* ── Layout ──────────────────────────────────────────────────────── */
	.map-wrapper {
		position: relative;
		display: flex;
		width: 100%;
		height: 100%;
		min-height: calc(100vh - 80px);
		overflow: hidden;
		background: #0f0f0f;
	}

	.map-container {
		flex: 1;
		min-height: 100%;
		z-index: 1;
	}

	/* ── Sidebar ─────────────────────────────────────────────────────── */
	.map-sidebar {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		background: #0a0a0a;
		border-right: 1px solid #27272a;
		transition: width 0.3s ease, min-width 0.3s ease;
		overflow: hidden;
	}

	.map-sidebar.open {
		width: 360px;
		min-width: 360px;
	}

	.map-sidebar.closed {
		width: 48px;
		min-width: 48px;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 1px solid #27272a;
		min-height: 56px;
	}

	.sidebar-header h2 {
		font-size: 1rem;
		font-weight: 700;
		color: #fafafa;
		white-space: nowrap;
		margin: 0;
	}

	.map-sidebar.closed .sidebar-header h2 {
		display: none;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 8px;
		background: #1a1a1a;
		color: #a1a1aa;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toggle-btn:hover {
		background: #27272a;
		color: #fafafa;
	}

	.sidebar-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
		padding: 12px;
		gap: 12px;
	}

	/* ── Search ──────────────────────────────────────────────────────── */
	.search-box {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #1a1a1a;
		border: 1px solid #27272a;
		border-radius: 10px;
		padding: 10px 14px;
		transition: border-color 0.2s;
	}

	.search-box:focus-within {
		border-color: #32415f;
	}

	.search-box svg {
		flex-shrink: 0;
		color: #a1a1aa;
	}

	.search-box input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: #fafafa;
		font-size: 0.875rem;
	}

	.search-box input::placeholder {
		color: #52525b;
	}

	/* ── Action buttons ──────────────────────────────────────────────── */
	.action-buttons {
		display: flex;
		gap: 8px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		flex: 1;
		padding: 8px 12px;
		border: 1px solid #27272a;
		border-radius: 10px;
		background: #1a1a1a;
		color: #a1a1aa;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.action-btn:hover {
		border-color: #32415f;
		color: #fafafa;
		background: rgba(50, 65, 95, 0.15);
	}

	.action-btn.locate:hover {
		border-color: #3b82f6;
		color: #60a5fa;
		background: rgba(59, 130, 246, 0.1);
	}

	.location-error {
		font-size: 0.75rem;
		color: #f87171;
		padding: 4px 8px;
		border-radius: 6px;
		background: rgba(248, 113, 113, 0.1);
	}

	/* ── Buildings list ──────────────────────────────────────────────── */
	.buildings-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
		flex: 1;
		padding-right: 4px;
	}

	.buildings-list::-webkit-scrollbar {
		width: 4px;
	}

	.buildings-list::-webkit-scrollbar-thumb {
		background: #3f3f46;
		border-radius: 2px;
	}

	.building-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 1px solid transparent;
		border-radius: 12px;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		color: #fafafa;
		width: 100%;
	}

	.building-card:hover {
		background: #1a1a1a;
		border-color: #27272a;
	}

	.building-card.active {
		background: rgba(50, 65, 95, 0.15);
		border-color: #32415f;
	}

	.building-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		color: white;
		font-size: 0.75rem;
		font-weight: 800;
		flex-shrink: 0;
		letter-spacing: -0.02em;
	}

	.building-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.building-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #fafafa;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.building-address {
		font-size: 0.75rem;
		color: #71717a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.building-dist {
		font-size: 0.688rem;
		color: #60a5fa;
		font-weight: 500;
	}

	.arrow-icon {
		flex-shrink: 0;
		color: #3f3f46;
		transition: color 0.2s, transform 0.2s;
	}

	.building-card:hover .arrow-icon {
		color: #a1a1aa;
		transform: translateX(2px);
	}

	.no-results {
		text-align: center;
		color: #52525b;
		font-size: 0.875rem;
		padding: 24px 0;
	}

	/* ── Mobile toggle ───────────────────────────────────────────────── */
	.mobile-sidebar-toggle {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: 1px solid #27272a;
		border-radius: 12px;
		background: rgba(10, 10, 10, 0.9);
		color: #fafafa;
		cursor: pointer;
		backdrop-filter: blur(8px);
		transition: all 0.2s;
	}

	.mobile-sidebar-toggle:hover {
		background: #1a1a1a;
		border-color: #32415f;
	}

	/* ── Leaflet custom markers ──────────────────────────────────────── */
	:global(.custom-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.marker-pin) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50% 50% 50% 0;
		transform: rotate(-45deg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	:global(.marker-pin:hover) {
		transform: rotate(-45deg) scale(1.15);
		box-shadow: 0 6px 20px rgba(50, 65, 95, 0.5);
	}

	:global(.marker-pin span) {
		transform: rotate(45deg);
		color: white;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	/* ── User location dot ───────────────────────────────────────────── */
	:global(.user-location-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.user-dot) {
		position: relative;
		width: 16px;
		height: 16px;
		background: #3b82f6;
		border: 3px solid white;
		border-radius: 50%;
		box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
	}

	:global(.user-dot-pulse) {
		position: absolute;
		top: -8px;
		left: -8px;
		width: 28px;
		height: 28px;
		background: rgba(59, 130, 246, 0.25);
		border-radius: 50%;
		animation: pulse 2s ease-out infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.5);
			opacity: 1;
		}
		100% {
			transform: scale(2);
			opacity: 0;
		}
	}

	/* ── Leaflet popup overrides ─────────────────────────────────────── */
	:global(.campus-popup-wrapper .leaflet-popup-content-wrapper) {
		background: #141414;
		border: 1px solid #27272a;
		border-radius: 14px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		color: #fafafa;
	}

	:global(.campus-popup-wrapper .leaflet-popup-tip) {
		background: #141414;
		border: 1px solid #27272a;
	}

	:global(.campus-popup-wrapper .leaflet-popup-close-button) {
		color: #a1a1aa !important;
	}

	:global(.campus-popup-wrapper .leaflet-popup-close-button:hover) {
		color: #fafafa !important;
	}

	:global(.campus-popup h3) {
		margin: 0 0 8px;
		font-size: 1rem;
		font-weight: 700;
		color: #fafafa;
	}

	:global(.campus-popup .popup-address) {
		font-size: 0.813rem;
		color: #a1a1aa;
		margin-bottom: 6px;
	}

	:global(.campus-popup .popup-desc) {
		font-size: 0.75rem;
		color: #71717a;
		margin: 4px 0 8px;
		line-height: 1.4;
	}

	:global(.campus-popup .popup-category) {
		margin-bottom: 8px;
	}

	:global(.campus-popup .cat-badge) {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 999px;
		color: white;
		font-size: 0.688rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	:global(.campus-popup .popup-faculties) {
		list-style: none;
		padding: 0;
		margin: 0 0 10px;
	}

	:global(.campus-popup .popup-faculties li) {
		font-size: 0.75rem;
		color: #d4d4d8;
		padding: 3px 0;
		border-bottom: 1px solid #1a1a1a;
	}

	:global(.campus-popup .popup-faculties li:last-child) {
		border-bottom: none;
	}

	:global(.campus-popup .popup-faculties .no-fac) {
		color: #52525b;
		font-style: italic;
	}

	:global(.campus-popup .popup-distance) {
		font-size: 0.75rem;
		color: #60a5fa;
		margin-bottom: 10px;
		font-weight: 500;
	}

	:global(.campus-popup .popup-directions) {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 14px;
		background: #32415f;
		color: white;
		border-radius: 10px;
		font-size: 0.813rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.2s, transform 0.15s;
	}

	:global(.campus-popup .popup-directions:hover) {
		background: #4a5a7a;
		transform: translateY(-1px);
	}

	/* ── Responsive ──────────────────────────────────────────────────── */
	@media (max-width: 1024px) {
		.map-sidebar.open {
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			width: 320px;
			min-width: 320px;
			z-index: 20;
			box-shadow: 8px 0 32px rgba(0, 0, 0, 0.5);
		}
	}

	@media (max-width: 640px) {
		.map-sidebar.open {
			width: 100%;
			min-width: 100%;
		}
	}
</style>
