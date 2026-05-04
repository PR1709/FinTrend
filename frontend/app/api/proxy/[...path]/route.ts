import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_KEY = process.env.FINTREND_API_KEY || "dev-secret-key";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, "GET");
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, "POST");
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, "DELETE");
}

async function proxy(req: NextRequest, path: string[], method: string) {
  const url = `${BACKEND}/api/v1/${path.join("/")}${req.nextUrl.search}`;

  const isFormData = req.headers.get("content-type")?.includes("multipart");
  const headers: Record<string, string> = {
    "X-API-Key": API_KEY,
  };
  if (!isFormData) headers["Content-Type"] = "application/json";

  let body: BodyInit | undefined;
  if (method !== "GET") {
    body = isFormData ? await req.formData() : await req.text();
  }

  try {
    const res = await fetch(url, { method, headers, body });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "PROXY_ERROR", message: String(e) }, timestamp: new Date().toISOString() },
      { status: 502 }
    );
  }
}
