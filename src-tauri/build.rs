use sha2::{Sha256, Digest};
use std::env;
use std::fs;
use std::path::Path;

/// Fichier caché pour persister le mot de passe entre les builds
const PASSWORD_CACHE_FILE: &str = ".admin_password";

/// Génère un mot de passe aléatoire de 16 caractères
fn generate_random_password() -> String {
    use rand::Rng;
    const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let mut rng = rand::thread_rng();
    (0..16)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

/// Hashe un mot de passe avec SHA-256 et retourne le hash en hexadécimal
fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

fn main() {
    let project_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
    let password_cache_path = project_root.join(PASSWORD_CACHE_FILE);
    
    // Récupérer le mot de passe admin (priorité: env > cache > génération)
    let admin_password = if let Ok(pwd) = env::var("ADMIN_PASSWORD") {
        // Variable d'environnement définie explicitement
        println!("cargo:warning=Utilisation de ADMIN_PASSWORD depuis l'environnement");
        pwd
    } else if password_cache_path.exists() {
        // Réutiliser le mot de passe du cache
        let cached = fs::read_to_string(&password_cache_path)
            .expect("Impossible de lire le cache du mot de passe");
        let cached = cached.trim().to_string();
        if !cached.is_empty() {
            println!("cargo:warning=Réutilisation du mot de passe admin existant");
            cached
        } else {
            println!("cargo:warning=Cache vide, génération d'un nouveau mot de passe...");
            generate_random_password()
        }
    } else {
        // Générer un nouveau mot de passe
        println!("cargo:warning=Génération d'un nouveau mot de passe admin...");
        generate_random_password()
    };

    // Sauvegarder le mot de passe dans le cache
    fs::write(&password_cache_path, &admin_password)
        .expect("Impossible d'écrire le cache du mot de passe");

    // Hasher le mot de passe
    let admin_hash = hash_password(&admin_password);

    // Écrire le mot de passe en clair dans admin-credentials.txt
    let credentials_path = project_root.join("admin-credentials.txt");
    let credentials_content = format!(
        "=== EXAM MANAGER - CREDENTIALS ADMIN ===\n\n\
Mot de passe administrateur: {}\n\n\
ATTENTION: Conservez ce fichier en lieu sûr!\n\
Ce fichier est généré automatiquement lors du build.\n\
Ne le partagez pas et ne le committez pas dans git.\n",
        admin_password
    );
    fs::write(&credentials_path, credentials_content)
        .expect("Impossible d'écrire admin-credentials.txt");

    println!("cargo:warning=Mot de passe admin écrit dans: {}", credentials_path.display());

    // Injecter le hash dans le code via variable d'environnement au build
    println!("cargo:rustc-env=ADMIN_PASSWORD_HASH={}", admin_hash);

    // Reconstruire si la variable d'environnement ou le cache change
    println!("cargo:rerun-if-env-changed=ADMIN_PASSWORD");
    println!("cargo:rerun-if-changed={}", password_cache_path.display());

    tauri_build::build()
}
