import type { GameInfo } from './launcher-detection';

export interface SteamShortcut {
	appId: string;
	name: string;
	exe: string;
	startDir: string;
	icon: string;
	shortcutPath: string;
	launchOptions: string;
}

export class SteamIntegrationService {
	private static readonly STEAM_PATHS = [
		'C:\\Program Files (x86)\\Steam',
		'C:\\Program Files\\Steam'
	];

	private steamPath: string | null = null;
	private userDataPath: string | null = null;

	constructor() {
		this.detectSteamPath();
	}

	private async detectSteamPath(): Promise<void> {
		// In real implementation, would check:
		// 1. Registry: HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Valve\Steam\InstallPath
		// 2. Common installation paths
		// 3. Environment variables

		for (const path of SteamIntegrationService.STEAM_PATHS) {
			try {
				// Mock detection - in real app would check if directory exists
				this.steamPath = path;
				this.userDataPath = `${path}\\userdata`;
				break;
			} catch (error) {
				continue;
			}
		}
	}

	async getSteamUsers(): Promise<string[]> {
		if (!this.userDataPath) {
			throw new Error('Steam not found');
		}

		// In real implementation, would:
		// 1. Read userdata directory
		// 2. Get list of user folders (Steam IDs)
		// 3. Return array of user IDs

		// Mock data for demo
		return ['123456789', '987654321'];
	}

	async addGameToSteam(game: GameInfo, userId: string = 'auto'): Promise<boolean> {
		if (!this.steamPath) {
			throw new Error('Steam not found');
		}

		try {
			// In real implementation, would:
			// 1. Read existing shortcuts.vdf file
			// 2. Parse VDF format
			// 3. Add new entry
			// 4. Write back to file
			// 5. Generate app ID using CRC32 algorithm

			const shortcut: SteamShortcut = {
				appId: this.generateAppId(game),
				name: game.name,
				exe: `"${game.installPath}\\${game.executable}"`,
				startDir: `"${game.installPath}"`,
				icon: game.icon || '',
				shortcutPath: '',
				launchOptions: this.getLaunchOptions(game)
			};

			await this.writeShortcutToVDF(shortcut, userId);

			// Download and set game artwork
			await this.downloadGameArtwork(game);

			return true;
		} catch (error) {
			console.error('Failed to add game to Steam:', error);
			return false;
		}
	}

	async addGamesToSteam(games: GameInfo[], userId: string = 'auto'): Promise<{ success: number; failed: string[] }> {
		let success = 0;
		const failed: string[] = [];

		for (const game of games) {
			try {
				const result = await this.addGameToSteam(game, userId);
				if (result) {
					success++;
				} else {
					failed.push(game.name);
				}
			} catch (error) {
				failed.push(game.name);
			}

			// Small delay to avoid overwhelming the system
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		return { success, failed };
	}

	async removeGameFromSteam(appId: string, userId: string = 'auto'): Promise<boolean> {
		// In real implementation, would:
		// 1. Read shortcuts.vdf
		// 2. Find and remove entry with matching appId
		// 3. Write back to file
		// 4. Remove artwork files

		return true;
	}

	private generateAppId(game: GameInfo): string {
		// In real implementation, would use CRC32 algorithm on exe path and name
		// This ensures consistent app IDs for the same game
		const input = `${game.executable}${game.name}`;
		let hash = 0;
		for (let i = 0; i < input.length; i++) {
			const char = input.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString();
	}

	private getLaunchOptions(game: GameInfo): string {
		// Different launchers may need specific launch options
		switch (game.launcherId) {
			case 'epic':
				return `-EpicPortal -epicapp=${game.id}`;
			case 'ubisoft':
				return `uplay://launch/${game.id}`;
			case 'ea':
				return `origin2://game/launch/?offerIds=${game.id}`;
			case 'gog':
				return `/command=runGame /gameId=${game.id}`;
			case 'battlenet':
				return `battlenet://${game.id}`;
			default:
				return '';
		}
	}

	private async writeShortcutToVDF(shortcut: SteamShortcut, userId: string): Promise<void> {
		// In real implementation, would:
		// 1. Parse existing shortcuts.vdf using binary VDF parser
		// 2. Add new shortcut entry
		// 3. Write back in VDF format

		// Mock implementation
		console.log(`Adding shortcut for ${shortcut.name} to user ${userId}`);
	}

	private async downloadGameArtwork(game: GameInfo): Promise<void> {
		// In real implementation, would:
		// 1. Search for game artwork using SteamGridDB API or similar
		// 2. Download grid images, heroes, logos, icons
		// 3. Save to Steam's grid folder with correct naming convention

		console.log(`Downloading artwork for ${game.name}`);
	}

	async restartSteam(): Promise<boolean> {
		// In real implementation, would:
		// 1. Terminate Steam process
		// 2. Wait for clean shutdown
		// 3. Restart Steam
		// This is needed for shortcuts to appear

		try {
			console.log('Restarting Steam to refresh game library...');
			return true;
		} catch (error) {
			console.error('Failed to restart Steam:', error);
			return false;
		}
	}

	isSteamRunning(): boolean {
		// In real implementation, would check if Steam process is running
		return true;
	}

	getSteamPath(): string | null {
		return this.steamPath;
	}
}
