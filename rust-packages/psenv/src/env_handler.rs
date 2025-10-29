use anyhow::{Context, Result};
use clap::ValueEnum;
use log::{debug, info, warn};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use crate::PsenvError;

#[derive(Debug, Clone, ValueEnum)]
pub enum Strategy {
    #[value(name = "merge")]
    Merge,
    #[value(name = "overwrite")]
    Overwrite,
    #[value(name = "replace")]
    Replace,
    #[value(name = "error")]
    Error,
}

pub struct EnvHandler;

impl EnvHandler {
    pub fn new() -> Self {
        EnvHandler
    }

    pub fn handle_env_file(
        &self,
        output_path: &str,
        values: &HashMap<String, String>,
        strategy: Strategy,
    ) -> Result<()> {
        debug!("Handling .env file: {} with strategy: {:?}", output_path, strategy);

        let output_exists = Path::new(output_path).exists();

        match strategy {
            Strategy::Error if output_exists => {
                return Err(PsenvError::FileExists(
                    format!("Output file already exists: {}", output_path)
                ).into());
            }
            Strategy::Replace => {
                self.write_env_file(output_path, values)?;
            }
            Strategy::Merge if output_exists => {
                self.merge_env_file(output_path, values)?;
            }
            Strategy::Overwrite if output_exists => {
                self.overwrite_env_file(output_path, values)?;
            }
            _ => {
                // For merge/overwrite when file doesn't exist, just create it
                self.write_env_file(output_path, values)?;
            }
        }

        info!("Successfully processed .env file: {}", output_path);
        Ok(())
    }

    fn write_env_file(&self, path: &str, values: &HashMap<String, String>) -> Result<()> {
        debug!("Writing new .env file: {}", path);

        let mut content = String::new();
        let mut sorted_keys: Vec<&String> = values.keys().collect();
        sorted_keys.sort();

        for key in sorted_keys {
            if let Some(value) = values.get(key) {
                content.push_str(&format!("{}={}\n", key, value));
            }
        }

        fs::write(path, content)
            .with_context(|| format!("Failed to write .env file: {}", path))?;

        info!("Created new .env file with {} variables", values.len());
        Ok(())
    }

    fn merge_env_file(&self, path: &str, new_values: &HashMap<String, String>) -> Result<()> {
        debug!("Merging with existing .env file: {}", path);

        let existing_content = fs::read_to_string(path)
            .with_context(|| format!("Failed to read existing .env file: {}", path))?;

        let mut existing_vars = self.parse_env_content(&existing_content)?;
        let mut added_count = 0;

        // Add new values only if they don't already exist
        for (key, value) in new_values {
            if !existing_vars.contains_key(key) {
                existing_vars.insert(key.clone(), value.clone());
                added_count += 1;
                debug!("Added new variable: {}", key);
            } else {
                debug!("Skipped existing variable: {}", key);
            }
        }

        self.write_env_from_map(path, &existing_vars)?;
        info!("Merged .env file: added {} new variables", added_count);
        Ok(())
    }

    fn overwrite_env_file(&self, path: &str, new_values: &HashMap<String, String>) -> Result<()> {
        debug!("Overwriting existing .env file: {}", path);

        let existing_content = fs::read_to_string(path)
            .with_context(|| format!("Failed to read existing .env file: {}", path))?;

        let mut existing_vars = self.parse_env_content(&existing_content)?;
        let mut updated_count = 0;
        let mut added_count = 0;

        // Update existing values and add new ones
        for (key, value) in new_values {
            if existing_vars.contains_key(key) {
                existing_vars.insert(key.clone(), value.clone());
                updated_count += 1;
                debug!("Updated existing variable: {}", key);
            } else {
                existing_vars.insert(key.clone(), value.clone());
                added_count += 1;
                debug!("Added new variable: {}", key);
            }
        }

        self.write_env_from_map(path, &existing_vars)?;
        info!("Overrote .env file: updated {} variables, added {} variables", updated_count, added_count);
        Ok(())
    }

    fn parse_env_content(&self, content: &str) -> Result<HashMap<String, String>> {
        let mut vars = HashMap::new();

        for (line_num, line) in content.lines().enumerate() {
            let trimmed = line.trim();

            // Skip empty lines and comments
            if trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }

            if let Some(eq_pos) = trimmed.find('=') {
                let key = trimmed[..eq_pos].trim().to_string();
                let value = trimmed[eq_pos + 1..].trim().to_string();

                if key.is_empty() {
                    warn!("Empty key on line {}, skipping", line_num + 1);
                    continue;
                }

                vars.insert(key, value);
            } else {
                warn!("Invalid line format on line {}: {}", line_num + 1, line);
            }
        }

        debug!("Parsed {} variables from existing .env content", vars.len());
        Ok(vars)
    }

    fn write_env_from_map(&self, path: &str, vars: &HashMap<String, String>) -> Result<()> {
        let mut content = String::new();
        let mut sorted_keys: Vec<&String> = vars.keys().collect();
        sorted_keys.sort();

        for key in sorted_keys {
            if let Some(value) = vars.get(key) {
                content.push_str(&format!("{}={}\n", key, value));
            }
        }

        fs::write(path, content)
            .with_context(|| format!("Failed to write .env file: {}", path))?;

        Ok(())
    }
}

impl Default for EnvHandler {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::NamedTempFile;

    #[test]
    fn test_write_env_file() {
        let handler = EnvHandler::new();
        let temp_file = NamedTempFile::new().unwrap();

        let mut values = HashMap::new();
        values.insert("KEY1".to_string(), "value1".to_string());
        values.insert("KEY2".to_string(), "value2".to_string());

        handler.write_env_file(temp_file.path().to_str().unwrap(), &values).unwrap();

        let content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(content.contains("KEY1=value1"));
        assert!(content.contains("KEY2=value2"));
    }

    #[test]
    fn test_merge_env_file() {
        let handler = EnvHandler::new();
        let temp_file = NamedTempFile::new().unwrap();

        // Create initial .env file
        let initial_content = "EXISTING_KEY=existing_value\nANOTHER_KEY=another_value\n";
        fs::write(temp_file.path(), initial_content).unwrap();

        let mut new_values = HashMap::new();
        new_values.insert("NEW_KEY".to_string(), "new_value".to_string());
        new_values.insert("EXISTING_KEY".to_string(), "should_not_overwrite".to_string());

        handler.merge_env_file(temp_file.path().to_str().unwrap(), &new_values).unwrap();

        let content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(content.contains("EXISTING_KEY=existing_value")); // Should keep existing
        assert!(content.contains("NEW_KEY=new_value")); // Should add new
        assert!(content.contains("ANOTHER_KEY=another_value")); // Should keep existing
        assert!(!content.contains("should_not_overwrite")); // Should not overwrite
    }

    #[test]
    fn test_overwrite_env_file() {
        let handler = EnvHandler::new();
        let temp_file = NamedTempFile::new().unwrap();

        // Create initial .env file
        let initial_content = "EXISTING_KEY=existing_value\nANOTHER_KEY=another_value\n";
        fs::write(temp_file.path(), initial_content).unwrap();

        let mut new_values = HashMap::new();
        new_values.insert("NEW_KEY".to_string(), "new_value".to_string());
        new_values.insert("EXISTING_KEY".to_string(), "overwritten_value".to_string());

        handler.overwrite_env_file(temp_file.path().to_str().unwrap(), &new_values).unwrap();

        let content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(content.contains("EXISTING_KEY=overwritten_value")); // Should overwrite
        assert!(content.contains("NEW_KEY=new_value")); // Should add new
        assert!(content.contains("ANOTHER_KEY=another_value")); // Should keep existing
    }
}