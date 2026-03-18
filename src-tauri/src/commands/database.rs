//! Commandes Tauri pour la gestion de la base de données
//! 
//! Ce module gère:
//! - Le chemin de la BD (dossier prisma en dev, app data en prod)
//! - L'initialisation de la BD
//! - L'export/import de la BD
//! - La réinitialisation de la BD

use sha2::{Sha256, Digest};
use std::fs;
use std::path::PathBuf;
use std::env;
use tauri::{AppHandle, Manager};

/// Hash du mot de passe admin injecté au build
const ADMIN_PASSWORD_HASH: &str = env!("ADMIN_PASSWORD_HASH");

/// Nom du fichier de base de données
const DB_FILENAME: &str = "exam-manager.db";

/// Retourne le chemin du dossier app data
fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Impossible d'obtenir le dossier app data: {}", e))
}

/// Retourne le chemin complet de la base de données
/// En mode debug/dev: cherche à la racine du projet (où Prisma la crée)
/// En mode release: utilise app_data_dir
fn get_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    // En mode debug, la BD est à la racine du projet (file:./exam-manager.db)
    if cfg!(debug_assertions) {
        if let Ok(cwd) = env::current_dir() {
            // BD à la racine du projet (DATABASE_URL="file:./exam-manager.db")
            let root_db = cwd.join(DB_FILENAME);
            if root_db.exists() {
                println!("[DEBUG] BD trouvée à la racine: {:?}", root_db);
                return Ok(root_db);
            }
            
            // Fallback: peut-être dans prisma/
            let prisma_db = cwd.join("prisma").join(DB_FILENAME);
            if prisma_db.exists() {
                println!("[DEBUG] BD trouvée dans prisma/: {:?}", prisma_db);
                return Ok(prisma_db);
            }
            
            // BD n'existe pas encore, retourner le chemin à la racine
            println!("[DEBUG] BD non trouvée, chemin par défaut: {:?}", root_db);
            return Ok(root_db);
        }
    }
    
    // Mode release: utiliser app_data
    let app_data = get_app_data_dir(app)?;
    Ok(app_data.join(DB_FILENAME))
}

/// Vérifie si le mot de passe fourni correspond au hash admin
fn verify_admin_password(password: &str) -> bool {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    let hash = hex::encode(result);
    
    // Debug: afficher les hashs pour diagnostic
    println!("[DEBUG] Password reçu: '{}'", password);
    println!("[DEBUG] Hash calculé: {}", hash);
    println!("[DEBUG] Hash attendu:  {}", ADMIN_PASSWORD_HASH);
    println!("[DEBUG] Match: {}", hash == ADMIN_PASSWORD_HASH);
    
    hash == ADMIN_PASSWORD_HASH
}

/// Commande: Retourne le chemin de la base de données
#[tauri::command]
pub fn get_database_path(app: AppHandle) -> Result<String, String> {
    let path = get_db_path(&app)?;
    Ok(path.to_string_lossy().to_string())
}

/// Commande: Initialise la base de données si elle n'existe pas
/// Crée le dossier app data et une BD vide si nécessaire
#[tauri::command]
pub fn init_database(app: AppHandle) -> Result<String, String> {
    let app_data = get_app_data_dir(&app)?;
    let db_path = app_data.join(DB_FILENAME);

    // Créer le dossier app data s'il n'existe pas
    if !app_data.exists() {
        fs::create_dir_all(&app_data)
            .map_err(|e| format!("Impossible de créer le dossier app data: {}", e))?;
    }

    // Si la BD n'existe pas, créer un fichier vide
    // Prisma se chargera de créer les tables via les migrations
    if !db_path.exists() {
        fs::File::create(&db_path)
            .map_err(|e| format!("Impossible de créer la base de données: {}", e))?;
    }

    Ok(db_path.to_string_lossy().to_string())
}

/// Commande: Vérifie le mot de passe admin
#[tauri::command]
pub fn verify_admin(password: String) -> bool {
    verify_admin_password(&password)
}

/// Commande: Exporte la base de données vers un chemin spécifié
/// Nécessite une vérification admin préalable côté frontend
#[tauri::command]
pub fn export_database(app: AppHandle, dest_path: String) -> Result<(), String> {
    let db_path = get_db_path(&app)?;

    if !db_path.exists() {
        return Err("La base de données n'existe pas".to_string());
    }

    fs::copy(&db_path, &dest_path)
        .map_err(|e| format!("Impossible d'exporter la base de données: {}", e))?;

    Ok(())
}

/// Commande: Importe une base de données depuis un chemin spécifié
/// Vérifie le mot de passe admin avant l'opération
#[tauri::command]
pub fn import_database(app: AppHandle, src_path: String, admin_password: String) -> Result<(), String> {
    // Vérifier le mot de passe admin
    if !verify_admin_password(&admin_password) {
        return Err("Mot de passe administrateur incorrect".to_string());
    }

    let src = PathBuf::from(&src_path);
    if !src.exists() {
        return Err("Le fichier source n'existe pas".to_string());
    }

    // Vérifier que c'est bien un fichier SQLite (vérification basique)
    let metadata = fs::metadata(&src)
        .map_err(|e| format!("Impossible de lire le fichier source: {}", e))?;
    
    if !metadata.is_file() {
        return Err("Le chemin spécifié n'est pas un fichier".to_string());
    }

    let db_path = get_db_path(&app)?;
    let app_data = get_app_data_dir(&app)?;

    // Créer le dossier app data s'il n'existe pas
    if !app_data.exists() {
        fs::create_dir_all(&app_data)
            .map_err(|e| format!("Impossible de créer le dossier app data: {}", e))?;
    }

    // Copier le fichier
    fs::copy(&src, &db_path)
        .map_err(|e| format!("Impossible d'importer la base de données: {}", e))?;

    Ok(())
}

/// Commande: Réinitialise la base de données (supprime et recrée vide)
/// Vérifie le mot de passe admin avant l'opération
#[tauri::command]
pub fn reset_database(app: AppHandle, admin_password: String) -> Result<(), String> {
    // Vérifier le mot de passe admin
    if !verify_admin_password(&admin_password) {
        return Err("Mot de passe administrateur incorrect".to_string());
    }

    let db_path = get_db_path(&app)?;

    // Supprimer la BD existante si elle existe
    if db_path.exists() {
        fs::remove_file(&db_path)
            .map_err(|e| format!("Impossible de supprimer la base de données: {}", e))?;
    }

    // Créer une nouvelle BD vide
    let app_data = get_app_data_dir(&app)?;
    if !app_data.exists() {
        fs::create_dir_all(&app_data)
            .map_err(|e| format!("Impossible de créer le dossier app data: {}", e))?;
    }

    fs::File::create(&db_path)
        .map_err(|e| format!("Impossible de créer la nouvelle base de données: {}", e))?;

    Ok(())
}

/// Commande: Vérifie si la base de données existe
#[tauri::command]
pub fn database_exists(app: AppHandle) -> Result<bool, String> {
    let db_path = get_db_path(&app)?;
    Ok(db_path.exists())
}
