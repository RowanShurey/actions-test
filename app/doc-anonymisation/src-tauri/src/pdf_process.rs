use std::fs::File;
use std::io::Write;
use std::path::Path;
use anyhow::Result;
use pdf_extract::extract_text;

/// Extracts all text from a PDF and writes it to a .txt file.
/// Arguments:
/// - `pdf_path` - Path to the input PDF file.
/// - `output_path` - Path where the extracted text will be written.
pub fn extract_pdf_text(
    pdf_path: impl AsRef<Path>,
    output_path: impl AsRef<Path>,
) -> Result<String> {
    // Extract all of the text into one String
    let text = extract_text(pdf_path.as_ref())?;

    // Write to the output file
    let mut file = File::create(output_path.as_ref())?;
    file.write_all(text.as_bytes())?;

    Ok(format!("Text saved to {:?}", output_path.as_ref()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_pdf_text_test_missing_input() {
        // Test case: missing input PDF
        let result = extract_pdf_text("nonexistent.pdf", "output.txt");
        assert!(result.is_err(), "Expected error for missing PDF input");
    }

    #[test]
    fn extract_pdf_text_test_unwritable_output() {
        // Test case: unwritable output path
        let result = extract_pdf_text("nonexistent.pdf", "/cannot_write_here/output.txt");
        assert!(result.is_err(), "Expected error when output path is unwritable");
    }

    #[test]
    fn extract_pdf_text_successful_case() {
        // Assumes a valid PDF exists at the root: ./sample.pdf
        let input_path = "sample.pdf";
        let output_path = "output_test.txt";

        // Clean up from previous runs (optional)
        let _ = std::fs::remove_file(output_path);

        // Act
        let result = extract_pdf_text(input_path, output_path);

        // Assert
        assert!(result.is_ok(), "Expected successful PDF text extraction");
        let output = result.unwrap();
        assert!(output.contains("Text saved to"), "Unexpected output message");

        let contents = std::fs::read_to_string(output_path).unwrap();
        assert!(!contents.trim().is_empty(), "Expected non-empty output file");

        // Clean up (optional)
        let _ = std::fs::remove_file(output_path);
    }
}
