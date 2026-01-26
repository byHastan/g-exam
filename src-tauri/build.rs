use sha2::{Sha256, Digest};
use std::env;
use std::fs;
use std::path::Path;

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
    // Récupérer ou générer le mot de passe admin
    let admin_password = env::var("ADMIN_PASSWORD").unwrap_or_else(|_| {
        println!("cargo:warning=ADMIN_PASSWORD non défini, génération automatique...");
        generate_random_password()
    });

    // Hasher le mot de passe
    let admin_hash = hash_password(&admin_password);

    // Écrire le mot de passe en clair dans admin-credentials.txt (à la racine du projet)
    let project_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
    let credentials_path = project_root.join("admin-credentials.txt");
    let credentials_content = format!(
        "=== EXAM MANAGER - CREDENTIALS ADMIN ===\n\
         \n\
         Mot de passe administrateur: {}\n\
         \n\
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

    // Reconstruire si la variable d'environnement change
    println!("cargo:rerun-if-env-changed=ADMIN_PASSWORD");

    tauri_build::build()
}
