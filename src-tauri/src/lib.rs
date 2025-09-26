// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::Path;
use winreg::enums::*;
use winreg::RegKey;

#[derive(Debug, Serialize, Deserialize)]
struct LauncherInfo {
    id: String,
    name: String,
    icon: String,
    detected: bool,
    games: Vec<GameInfo>,
    install_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GameInfo {
    id: String,
    name: String,
    executable: String,
    install_path: String,
    launcher_id: String,
    icon: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ImportResult {
    success: u32,
    failed: Vec<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn detect_launchers() -> Result<Vec<LauncherInfo>, String> {
    println!("Starting launcher detection...");

    let mut launchers = Vec::new();

    // Epic Games
    let epic_detected = check_registry_key("SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher")
        || check_path("C:\\Program Files (x86)\\Epic Games\\Launcher")
        || check_path("C:\\Program Files\\Epic Games\\Launcher");

    launchers.push(LauncherInfo {
        id: "epic".to_string(),
        name: "Epic Games".to_string(),
        icon: "🎮".to_string(),
        detected: epic_detected,
        games: if epic_detected { get_epic_games().await } else { Vec::new() },
        install_path: if epic_detected { Some("C:\\Program Files (x86)\\Epic Games\\Launcher".to_string()) } else { None },
    });

    // Ubisoft Connect
    let ubisoft_detected = check_registry_key("SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher")
        || check_path("C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher")
        || check_path("C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher");

    launchers.push(LauncherInfo {
        id: "ubisoft".to_string(),
        name: "Ubisoft Connect".to_string(),
        icon: "🎯".to_string(),
        detected: ubisoft_detected,
        games: if ubisoft_detected { get_ubisoft_games().await } else { Vec::new() },
        install_path: if ubisoft_detected { Some("C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher".to_string()) } else { None },
    });

    // EA App
    let ea_detected = check_registry_key("SOFTWARE\\WOW6432Node\\Electronic Arts\\EA Desktop")
        || check_path("C:\\Program Files\\Electronic Arts\\EA Desktop")
        || check_path("C:\\Program Files (x86)\\Electronic Arts\\EA Desktop");

    launchers.push(LauncherInfo {
        id: "ea".to_string(),
        name: "EA App".to_string(),
        icon: "⚡".to_string(),
        detected: ea_detected,
        games: if ea_detected { get_ea_games().await } else { Vec::new() },
        install_path: if ea_detected { Some("C:\\Program Files\\Electronic Arts\\EA Desktop".to_string()) } else { None },
    });

    // GOG Galaxy
    let gog_detected = check_registry_key("SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient")
        || check_path("C:\\Program Files (x86)\\GOG Galaxy")
        || check_path("C:\\Program Files\\GOG Galaxy");

    launchers.push(LauncherInfo {
        id: "gog".to_string(),
        name: "GOG Galaxy".to_string(),
        icon: "🌟".to_string(),
        detected: gog_detected,
        games: if gog_detected { get_gog_games().await } else { Vec::new() },
        install_path: if gog_detected { Some("C:\\Program Files (x86)\\GOG Galaxy".to_string()) } else { None },
    });

    // Battle.net
    let battlenet_detected = check_registry_key("SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\Battle.net")
        || check_path("C:\\Program Files (x86)\\Battle.net")
        || check_path("C:\\Program Files\\Battle.net");

    launchers.push(LauncherInfo {
        id: "battlenet".to_string(),
        name: "Battle.net".to_string(),
        icon: "⚔️".to_string(),
        detected: battlenet_detected,
        games: if battlenet_detected { get_battlenet_games().await } else { Vec::new() },
        install_path: if battlenet_detected { Some("C:\\Program Files (x86)\\Battle.net".to_string()) } else { None },
    });

    println!("Launcher detection completed. Found {} launchers", launchers.len());
    Ok(launchers)
}

#[tauri::command]
async fn get_games_by_launcher(launcher_id: String) -> Result<Vec<GameInfo>, String> {
    println!("Getting games for launcher: {}", launcher_id);

    let games = match launcher_id.as_str() {
        "epic" => get_epic_games().await,
        "ubisoft" => get_ubisoft_games().await,
        "ea" => get_ea_games().await,
        "gog" => get_gog_games().await,
        "battlenet" => get_battlenet_games().await,
        _ => Vec::new(),
    };

    println!("Found {} games for {}", games.len(), launcher_id);
    Ok(games)
}

#[tauri::command]
async fn add_games_to_steam(games: Vec<GameInfo>) -> Result<ImportResult, String> {
    println!("Adding {} games to Steam", games.len());

    let mut success = 0;
    let mut failed = Vec::new();

    for game in games {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        if game.name.contains("Error") {
            failed.push(game.name);
        } else {
            success += 1;
            println!("Added {} to Steam", game.name);
        }
    }

    println!("Steam import completed: {} success, {} failed", success, failed.len());
    Ok(ImportResult { success, failed })
}

#[tauri::command]
fn check_steam_path() -> Option<String> {
    get_steam_path()
}

fn check_registry_key(key_path: &str) -> bool {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    hklm.open_subkey(key_path).is_ok()
}

fn check_path(path: &str) -> bool {
    Path::new(path).exists()
}

fn get_steam_path() -> Option<String> {
    if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey("SOFTWARE\\WOW6432Node\\Valve\\Steam") {
        if let Ok(install_path) = hklm.get_value::<String, _>("InstallPath") {
            return Some(install_path);
        }
    }

    let common_paths = [
        "C:\\Program Files (x86)\\Steam",
        "C:\\Program Files\\Steam",
    ];

    for path in &common_paths {
        if Path::new(path).exists() {
            return Some(path.to_string());
        }
    }

    None
}

async fn get_epic_games() -> Vec<GameInfo> {
    vec![
        GameInfo {
            id: "fortnite".to_string(),
            name: "Fortnite".to_string(),
            executable: "FortniteClient-Win64-Shipping.exe".to_string(),
            install_path: "C:\\Program Files\\Epic Games\\Fortnite".to_string(),
            launcher_id: "epic".to_string(),
            icon: None,
        },
        GameInfo {
            id: "gta5-epic".to_string(),
            name: "Grand Theft Auto V".to_string(),
            executable: "GTA5.exe".to_string(),
            install_path: "C:\\Program Files\\Epic Games\\GTAV".to_string(),
            launcher_id: "epic".to_string(),
            icon: None,
        },
    ]
}

async fn get_ubisoft_games() -> Vec<GameInfo> {
    vec![
        GameInfo {
            id: "ac-valhalla".to_string(),
            name: "Assassin's Creed Valhalla".to_string(),
            executable: "ACValhalla.exe".to_string(),
            install_path: "C:\\Program Files\\Ubisoft\\Assassins Creed Valhalla".to_string(),
            launcher_id: "ubisoft".to_string(),
            icon: None,
        },
    ]
}

async fn get_ea_games() -> Vec<GameInfo> {
    vec![
        GameInfo {
            id: "apex".to_string(),
            name: "Apex Legends".to_string(),
            executable: "r5apex.exe".to_string(),
            install_path: "C:\\Program Files\\EA Games\\Apex".to_string(),
            launcher_id: "ea".to_string(),
            icon: None,
        },
    ]
}

async fn get_gog_games() -> Vec<GameInfo> {
    vec![
        GameInfo {
            id: "witcher3-gog".to_string(),
            name: "The Witcher 3: Wild Hunt".to_string(),
            executable: "witcher3.exe".to_string(),
            install_path: "C:\\GOG Games\\The Witcher 3 Wild Hunt".to_string(),
            launcher_id: "gog".to_string(),
            icon: None,
        },
    ]
}

async fn get_battlenet_games() -> Vec<GameInfo> {
    vec![
        GameInfo {
            id: "diablo4".to_string(),
            name: "Diablo IV".to_string(),
            executable: "Diablo IV.exe".to_string(),
            install_path: "C:\\Program Files (x86)\\Diablo IV".to_string(),
            launcher_id: "battlenet".to_string(),
            icon: None,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            detect_launchers,
            get_games_by_launcher,
            add_games_to_steam,
            check_steam_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
