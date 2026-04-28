class UserState {
	name = $state('George-Sebastian Somu');
	username = $state('sebig');
	email = $state('george.somu@student.unitbv.ro');
	university = $state('Transilvania University of Brașov');
	memberSince = $state('April 2026');
	avatarInitials = $state('GS');
	avatarUrl = $state<string | null>(null);
	avatarSource = $derived(this.avatarUrl);
}

export const user = new UserState();
