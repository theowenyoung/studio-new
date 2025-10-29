use anyhow::{Context, Result};
use log::debug;
use regex::Regex;
use std::collections::HashSet;
use std::fs;

pub struct TemplateParser {
    env_key_regex: Regex,
}

impl TemplateParser {
    pub fn new() -> Self {
        // Regex to match environment variable keys in .env files
        // Matches lines like: KEY=value, KEY= (empty value), # KEY=value (commented)
        let env_key_regex = Regex::new(r"^#?\s*([A-Z_][A-Z0-9_]*)\s*=").unwrap();

        TemplateParser { env_key_regex }
    }

    pub fn parse_template(&self, template_path: &str) -> Result<Vec<String>> {
        debug!("Parsing template file: {}", template_path);

        let content = fs::read_to_string(template_path)
            .with_context(|| format!("Failed to read template file: {}", template_path))?;

        let mut keys = HashSet::new();

        for (line_num, line) in content.lines().enumerate() {
            let trimmed = line.trim();

            // Skip empty lines and comments that don't contain env vars
            if trimmed.is_empty() || (trimmed.starts_with('#') && !trimmed.contains('=')) {
                continue;
            }

            if let Some(captures) = self.env_key_regex.captures(trimmed) {
                if let Some(key_match) = captures.get(1) {
                    let key = key_match.as_str().to_string();
                    debug!("Found key '{}' on line {}", key, line_num + 1);
                    keys.insert(key);
                }
            }
        }

        let mut result: Vec<String> = keys.into_iter().collect();
        result.sort();

        debug!("Parsed {} unique keys from template", result.len());

        Ok(result)
    }
}

impl Default for TemplateParser {
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
    fn test_parse_template() {
        let parser = TemplateParser::new();

        let template_content = r#"
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp

# API Keys
API_KEY=
SECRET_KEY=supersecret

# Comments and empty lines

# This is just a comment
ANOTHER_KEY=value
"#;

        let temp_file = NamedTempFile::new().unwrap();
        fs::write(temp_file.path(), template_content).unwrap();

        let keys = parser.parse_template(temp_file.path().to_str().unwrap()).unwrap();

        let expected_keys = vec![
            "ANOTHER_KEY",
            "API_KEY",
            "DB_HOST",
            "DB_NAME",
            "DB_PORT",
            "SECRET_KEY",
        ];

        assert_eq!(keys, expected_keys);
    }

    #[test]
    fn test_parse_template_with_commented_vars() {
        let parser = TemplateParser::new();

        let template_content = r#"
DB_HOST=localhost
# DB_PORT=5432
#API_KEY=commented_out
"#;

        let temp_file = NamedTempFile::new().unwrap();
        fs::write(temp_file.path(), template_content).unwrap();

        let keys = parser.parse_template(temp_file.path().to_str().unwrap()).unwrap();

        let expected_keys = vec!["API_KEY", "DB_HOST", "DB_PORT"];

        assert_eq!(keys, expected_keys);
    }
}