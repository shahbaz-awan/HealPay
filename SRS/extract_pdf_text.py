import sys
from pathlib import Path
from pdfminer.high_level import extract_text


def main() -> None:
	# Configure input/output paths
	pdf_path = Path(r"D:\FYP\FYP Proposal .pdf")
	output_path = Path(r"D:\FYP\FYP_Proposal_text.txt")

	if not pdf_path.exists():
		sys.stderr.write(f"Input PDF not found: {pdf_path}\n")
		sys.exit(1)

	# Extract text
	text = extract_text(str(pdf_path))

	# Ensure directory exists and write output with UTF-8 encoding
	output_path.parent.mkdir(parents=True, exist_ok=True)
	output_path.write_text(text or "", encoding="utf-8")
	print(f"Extracted text written to: {output_path}")


if __name__ == "__main__":
	main()

