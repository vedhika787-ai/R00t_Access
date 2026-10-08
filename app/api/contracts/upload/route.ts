import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { parseContractFile } from "@/lib/parsing";
import { segmentContract } from "@/lib/segmentation";
import { rateLimit } from "@/lib/rate-limit";
import { Contract, Clause } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "local_user";
    const limiter = await rateLimit(`upload_${ip}`, 20, 60);
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before uploading again." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const vendorName = (formData.get("vendor_name") as string | null) || "Vendor Partner";
    const title = (formData.get("title") as string | null) || file?.name || "Vendor Agreement";

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload." }, { status: 400 });
    }

    // 2. Buffer conversion and parsing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await parseContractFile(buffer, file.name);

    // 3. Create Contract Record
    const contractId = crypto.randomUUID();
    const contract: Contract = {
      id: contractId,
      organization_id: DEFAULT_ORG_ID,
      uploaded_by: DEFAULT_USER_ID,
      vendor_name: vendorName.trim(),
      title: title.trim(),
      file_path: `contracts/${DEFAULT_ORG_ID}/${contractId}/${file.name}`,
      file_type: parsed.fileType,
      file_size: file.size,
      status: "processing",
      risk_score_original: 0,
      risk_score_current: 0,
      recommendation: "negotiate",
      processing_ms: 0,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.createContract(contract);

    // 4. Segment Clauses
    const rawClauses = segmentContract(parsed.text, contractId, parsed.pages);
    const clauses: Clause[] = rawClauses.map((c) => ({
      id: crypto.randomUUID(),
      contract_id: contractId,
      order_index: c.order_index,
      clause_number: c.clause_number,
      heading: c.heading,
      text: c.text,
      page: c.page,
      char_start: c.char_start,
      char_end: c.char_end,
      embedding: null,
      category: c.category,
      created_at: new Date().toISOString(),
    }));

    db.saveClauses(clauses);

    // 5. Append-only Audit Log
    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: contractId,
      user_id: DEFAULT_USER_ID,
      action: "upload_contract",
      entity: "contracts",
      entity_id: contractId,
      metadata: {
        vendor_name: vendorName,
        file_name: file.name,
        file_size: file.size,
        clauses_count: clauses.length,
      },
      ip,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      contractId,
      clausesCount: clauses.length,
      pageCount: parsed.pageCount,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse and upload contract." },
      { status: err.code === "SCANNED_PDF_DETECTED" ? 422 : 400 }
    );
  }
}
