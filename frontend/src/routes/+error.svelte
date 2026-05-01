<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ErrorPage from '$lib/components/ErrorPage.svelte';

	// Map status code -> error page configuration
	const errorConfig: Record<number, { title: string; message: string; actions: Array<{ label: string; href?: string; onClick?: () => void; variant?: 'primary' | 'secondary' }> }> = {
		404: {
			title: 'Page Not Found',
			message: 'Sorry, the page you are looking for does not exist or has been moved. Check the URL or go back to the homepage.',
			actions: [
				{ label: 'Back Home', href: '/', variant: 'primary' },
				{ label: 'Go to Login', href: '/login', variant: 'secondary' }
			]
		},
		403: {
			title: 'Access Forbidden',
			message: 'You do not have permission to access this resource. Make sure you are logged in with the correct account.',
			actions: [
				{ label: 'Login', href: '/login', variant: 'primary' },
				{ label: 'Back Home', href: '/', variant: 'secondary' }
			]
		},
		401: {
			title: 'Authentication Required',
			message: 'You need to log in to access this page. Sign in with your account to continue.',
			actions: [
				{ label: 'Go to Login', href: '/login', variant: 'primary' }
			]
		},
		500: {
			title: 'Server Error',
			message: 'Something went wrong on our end. We are working to fix the issue as soon as possible.',
			actions: [
				{ label: 'Try Again', onClick: () => window.location.reload(), variant: 'primary' },
				{ label: 'Back Home', href: '/', variant: 'secondary' }
			]
		}
	};

	let status = $derived($page.status || 404);
	let config = $derived(errorConfig[status] || errorConfig[404]);
</script>

<svelte:head>
	<title>Error {status} | UniThread</title>
</svelte:head>

<ErrorPage
	{status}
	title={config.title}
	message={config.message}
	actions={config.actions}
/>
