import time
import uuid
import boto3
from app.config import get_settings

settings = get_settings()
client = boto3.client("textract", region_name=settings.aws_region)
s3_client = boto3.client("s3", region_name=settings.aws_region)


def extract_text_from_image(image_bytes: bytes) -> str:
    """Extract text from lab report image using AWS Textract."""
    response = client.detect_document_text(
        Document={"Bytes": image_bytes}
    )

    lines = []
    for block in response.get("Blocks", []):
        if block["BlockType"] == "LINE":
            lines.append(block["Text"])

    return "\n".join(lines)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF using Textract async API via S3.

    The synchronous Textract API does not support PDFs — PDFs must be
    uploaded to S3 and processed via start_document_text_detection.
    """
    # Upload PDF to S3 temporarily
    temp_key = f"temp/textract-{uuid.uuid4().hex}.pdf"
    s3_client.put_object(
        Bucket=settings.s3_bucket,
        Key=temp_key,
        Body=pdf_bytes,
        ContentType="application/pdf",
    )
    print(f"[TEXTRACT] Uploaded PDF to s3://{settings.s3_bucket}/{temp_key}")

    try:
        # Start async text detection
        response = client.start_document_text_detection(
            DocumentLocation={
                "S3Object": {
                    "Bucket": settings.s3_bucket,
                    "Name": temp_key,
                }
            }
        )
        job_id = response["JobId"]
        print(f"[TEXTRACT] Started job {job_id}")

        # Poll until complete (typically 5-15 seconds for a few pages)
        for attempt in range(30):
            time.sleep(2)
            result = client.get_document_text_detection(JobId=job_id)
            status = result["JobStatus"]
            if status == "SUCCEEDED":
                break
            elif status == "FAILED":
                print(f"[TEXTRACT] Job failed: {result.get('StatusMessage', 'unknown')}")
                return ""
        else:
            print("[TEXTRACT] Job timed out after 60 seconds")
            return ""

        # Collect all pages of results
        lines = []
        for block in result.get("Blocks", []):
            if block["BlockType"] == "LINE":
                lines.append(block["Text"])

        # Handle pagination (large documents)
        next_token = result.get("NextToken")
        while next_token:
            result = client.get_document_text_detection(
                JobId=job_id, NextToken=next_token
            )
            for block in result.get("Blocks", []):
                if block["BlockType"] == "LINE":
                    lines.append(block["Text"])
            next_token = result.get("NextToken")

        text = "\n".join(lines)
        print(f"[TEXTRACT] Extracted {len(lines)} lines from PDF")
        return text

    finally:
        # Clean up temp file
        try:
            s3_client.delete_object(Bucket=settings.s3_bucket, Key=temp_key)
        except Exception:
            pass


def extract_tables_from_image(image_bytes: bytes) -> list[dict]:
    """Extract table data from lab report image using Textract."""
    response = client.analyze_document(
        Document={"Bytes": image_bytes},
        FeatureTypes=["TABLES"],
    )

    tables = []
    cells = {}
    table_ids = set()

    for block in response.get("Blocks", []):
        if block["BlockType"] == "TABLE":
            table_ids.add(block["Id"])
        elif block["BlockType"] == "CELL":
            cell_data = {
                "row": block.get("RowIndex", 0),
                "col": block.get("ColumnIndex", 0),
                "text": "",
            }
            # Get child text
            if "Relationships" in block:
                for rel in block["Relationships"]:
                    if rel["Type"] == "CHILD":
                        for child_id in rel["Ids"]:
                            for b in response["Blocks"]:
                                if b["Id"] == child_id and b["BlockType"] == "WORD":
                                    cell_data["text"] += b["Text"] + " "
            cell_data["text"] = cell_data["text"].strip()
            cells[block["Id"]] = cell_data

    # Group cells by table
    for block in response.get("Blocks", []):
        if block["BlockType"] == "TABLE" and "Relationships" in block:
            table = {}
            for rel in block["Relationships"]:
                if rel["Type"] == "CHILD":
                    for cell_id in rel["Ids"]:
                        if cell_id in cells:
                            c = cells[cell_id]
                            row_key = c["row"]
                            if row_key not in table:
                                table[row_key] = {}
                            table[row_key][c["col"]] = c["text"]
            tables.append(table)

    return tables
