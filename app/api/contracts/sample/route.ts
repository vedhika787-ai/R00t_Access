import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { parseContractFile } from "@/lib/parsing";
import { segmentContract } from "@/lib/segmentation";
import { Contract, Clause } from "@/types/database";

export async function POST() {
  try {
    const samplePath = path.join(process.cwd(), "samples", "vendor_msa_sample.docx");
    if (!fs.existsSync(samplePath)) {
      return NextResponse.json({ error: "Sample file not found" }, { status: 404 });
    }

    const buffer = fs.readFileSync(samplePath);
    const parsed = await parseContractFile(buffer, "vendor_msa_sample.docx");

    const contractId = crypto.randomUUID();
    const contract: Contract = {
      id: contractId,
      organization_id: DEFAULT_ORG_ID,
      uploaded_by: DEFAULT_USER_ID,
      vendor_name: "ApexCloud Solutions Ltd.",
      title: "Master Services Agreement (Cloud & Analytics)",
      file_path: `samples/vendor_msa_sample.pdf`,
      file_type: "pdf",
      file_size: buffer.length,
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

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: contractId,
      user_id: DEFAULT_USER_ID,
      action: "load_sample_contract",
      entity: "contracts",
      entity_id: contractId,
      metadata: { vendor: contract.vendor_name, clauses: clauses.length },
      ip: "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      contractId,
      clausesCount: clauses.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
