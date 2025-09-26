export interface GameInfo {
	id: string;
	name: string;
	executable: string;
	installPath: string;
	launcherId: string;
	icon?: string;
}

export interface LauncherInfo {
	id: string;
	name: string;
	icon: string;
	detected: boolean;
	games: GameInfo[];
	installPath?: string;
	registryKey?: string;
}

export class LauncherDetectionService {
	private static readonly LAUNCHER_CONFIGS = {
		epic: {
			name: 'Epic Games',
			icon: '🎮',
			registryKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher',
			commonPaths: [
				'C:\\Program Files (x86)\\Epic Games\\Launcher',
				'C:\\Program Files\\Epic Games\\Launcher'
			],
			gamesPaths: [
				'%PROGRAMDATA%\\Epic\\EpicGamesLauncher\\Data\\Manifests'
			]
		},
		steam: {
			name: 'Steam',
			icon: '💨',
			registryKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Valve\\Steam',
			commonPaths: [
				'C:\\Program Files (x86)\\Steam',
				'C:\\Program Files\\Steam'
			]
		},
		ubisoft: {
			name: 'Ubisoft Connect',
			icon: '🎯',
			registryKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher',
			commonPaths: [
				'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher',
				'C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher'
			]
		},
		ea: {
			name: 'EA App',
			icon: '⚡',
			registryKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Electronic Arts\\EA Desktop',
			commonPaths: [
				'C:\\Program Files\\Electronic Arts\\EA Desktop',
				'C:\\Program Files (x86)\\Electronic Arts\\EA Desktop'
			]
		},
		gog: {
			name: 'GOG Galaxy',
			icon: '🌟',
			registryKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient',
			commonPaths: [
				'C:\\Program Files (x86)\\GOG Galaxy',
				'C:\\Program Files\\GOG Galaxy'
			]
		},
		battlenet: {
			name: 'Battle.net',
			icon: '⚔️',
			registryKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\Battle.net',
			commonPaths: [
				'C:\\Program Files (x86)\\Battle.net',
				'C:\\Program Files\\Battle.net'
			]
		},
		rockstar: {
			name: 'Rockstar Games Launcher',
			icon: '🌟',
			registryKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Rockstar Games\\Launcher',
			commonPaths: [
				'C:\\Program Files\\Rockstar Games\\Launcher',
				'C:\\Program Files (x86)\\Rockstar Games\\Launcher'
			]
		}
	};

	async detectLaunchers(): Promise<LauncherInfo[]> {
		const results: LauncherInfo[] = [];

		for (const [id, config] of Object.entries(this.LAUNCHER_CONFIGS)) {
			const detected = await this.detectLauncher(id);
			const games = detected ? await this.getGamesForLauncher(id) : [];

			results.push({
				id,
				name: config.name,
				icon: config.icon,
				detected,
				games,
				installPath: detected ? await this.getLauncherPath(id) : undefined
			});
		}

		return results;
	}

	private async detectLauncher(launcherId: string): Promise<boolean> {
		// In a real implementation, this would check:
		// 1. Registry entries
		// 2. Common installation paths
		// 3. Running processes

		// For demo purposes, simulate detection
		const detectionChance = launcherId === 'ea' || launcherId === 'rockstar' ? 0.3 : 0.8;
		return Math.random() < detectionChance;
	}

	private async getLauncherPath(launcherId: string): Promise<string | undefined> {
		const config = this.LAUNCHER_CONFIGS[launcherId as keyof typeof this.LAUNCHER_CONFIGS];

		// In a real implementation, this would:
		// 1. Check registry for install path
		// 2. Check common installation directories
		// 3. Return the actual path

		return config.commonPaths[0];
	}

	private async getGamesForLauncher(launcherId: string): Promise<GameInfo[]> {
		// Mock game data - in real implementation would scan:
		// - Epic: Manifest files in %PROGRAMDATA%\Epic\EpicGamesLauncher\Data\Manifests
		// - Steam: steamapps folder and registry
		// - Ubisoft: Configuration files and registry
		// - etc.

		const mockGames: Record<string, GameInfo[]> = {
			epic: [
				{
					id: 'fortnite',
					name: 'Fortnite',
					executable: 'FortniteClient-Win64-Shipping.exe',
					installPath: 'C:\\Program Files\\Epic Games\\Fortnite',
					launcherId: 'epic'
				},
				{
					id: 'gta5-epic',
					name: 'Grand Theft Auto V',
					executable: 'GTA5.exe',
					installPath: 'C:\\Program Files\\Epic Games\\GTAV',
					launcherId: 'epic'
				}
			],
			ubisoft: [
				{
					id: 'ac-valhalla',
					name: 'Assassin\'s Creed Valhalla',
					executable: 'ACValhalla.exe',
					installPath: 'C:\\Program Files\\Ubisoft\\Assassins Creed Valhalla',
					launcherId: 'ubisoft'
				}
			],
			gog: [
				{
					id: 'witcher3-gog',
					name: 'The Witcher 3: Wild Hunt',
					executable: 'witcher3.exe',
					installPath: 'C:\\GOG Games\\The Witcher 3 Wild Hunt',
					launcherId: 'gog'
				}
			],
			battlenet: [
				{
					id: 'diablo4',
					name: 'Diablo IV',
					executable: 'Diablo IV.exe',
					installPath: 'C:\\Program Files (x86)\\Diablo IV',
					launcherId: 'battlenet'
				}
			]
		};

		return mockGames[launcherId] || [];
	}

	async getGamesByLauncher(launcherId: string): Promise<GameInfo[]> {
		return await this.getGamesForLauncher(launcherId);
	}
}
