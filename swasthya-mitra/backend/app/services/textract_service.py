import boto3
from app.config import get_settings

settings = get_settings()
client = boto3.client("textract", region_name=settings.aws_region)


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
