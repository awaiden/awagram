const INSTAGRAM_URL: &str = "https://www.instagram.com";
const MOBILE_USER_AGENT: &str = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const INJECT_SCRIPT: &str = include_str!("inject.js");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let url = INSTAGRAM_URL.parse::<tauri::Url>()?;
            let builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(url),
            )
            .user_agent(MOBILE_USER_AGENT)
            .initialization_script(INJECT_SCRIPT);

            #[cfg(not(mobile))]
            let builder = builder
                .title("awagram")
                .inner_size(430.0, 900.0)
                .min_inner_size(360.0, 640.0);

            builder.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn instagram_url_parses_validly() {
        let parsed = INSTAGRAM_URL.parse::<tauri::Url>();
        assert!(parsed.is_ok(), "INSTAGRAM_URL should parse as tauri::Url");
        let url = parsed.unwrap();
        assert_eq!(url.scheme(), "https");
        assert_eq!(url.host_str(), Some("www.instagram.com"));
    }

    #[test]
    fn mobile_user_agent_has_expected_tokens() {
        assert!(MOBILE_USER_AGENT.contains("Android"));
        assert!(MOBILE_USER_AGENT.contains("Mobile"));
    }

    #[test]
    fn inject_script_is_non_empty() {
        assert!(!INJECT_SCRIPT.trim().is_empty());
    }
}
