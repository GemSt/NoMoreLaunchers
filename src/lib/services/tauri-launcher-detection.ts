import { invoke } from '@tauri-apps/api/tauri';

export interface GameInfo {
	id: string;
	name: string;
	executable: string;
	install_path: string;
	launcher_id: string;
	icon?: string;
}

export interface LauncherInfo {
	id: string;
	name: string;
	icon: string;
	detected: boolean;
	games: GameInfo[];
	install_path?: string;
}

export interface ImportResult {
	success: number;
	failed: string[];
}

export class TauriLauncherDetectionService {
	async detectLaunchers(): Promise<LauncherInfo[]> {
		try {
			console.log('Starting launcher detection via Tauri...');
			const launchers = await invoke<LauncherInfo[]>('detect_launchers');
			console.log('Detected launchers:', launchers);
			return launchers;
		} catch (error) {
			console.error('Failed to detect launchers:', error);
			throw new Error(`Launcher detection failed: ${error}`);
		}
	}

	async getGamesByLauncher(launcherId: string): Promise<GameInfo[]> {
		try {
			console.log(`Getting games for launcher: ${launcherId}`);
			const games = await invoke<GameInfo[]>('get_games_by_launcher', {
				launcherId
			});
			console.log(`Found ${games.length} games for ${launcherId}`);
			return games;
		} catch (error) {
			console.error(`Failed to get games for ${launcherId}:`, error);
			throw new Error(`Failed to get games for ${launcherId}: ${error}`);
		}
	}
}

export class TauriSteamIntegrationService {
	async addGamesToSteam(games: GameInfo[]): Promise<ImportResult> {
		try {
			console.log(`Adding ${games.length} games to Steam...`);
			const result = await invoke<ImportResult>('add_games_to_steam', {
				games
			});
			console.log('Import result:', result);
			return result;
		} catch (error) {
			console.error('Failed to add games to Steam:', error);
			throw new Error(`Steam import failed: ${error}`);
		}
	}

	async addGameToSteam(game: GameInfo): Promise<boolean> {
		const result = await this.addGamesToSteam([game]);
		return result.success > 0;
	}

	async checkSteamPath(): Promise<string | null> {
		try {
			const steamPath = await invoke<string | null>('check_steam_path');
			console.log('Steam path:', steamPath);
			return steamPath;
		} catch (error) {
			console.error('Failed to check Steam path:', error);
			return null;
		}
	}

	getSteamPath(): Promise<string | null> {
		return this.checkSteamPath();
	}

	async restartSteam(): Promise<boolean> {
		// This would require additional Tauri commands to manage processes
		console.log('Steam restart would be implemented here');
		return true;
	}

	isSteamRunning(): boolean {
		// This would require process detection
		return true;
	}
}
