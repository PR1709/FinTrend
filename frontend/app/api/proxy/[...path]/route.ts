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
  let baseUrl = BACKEND;
  // If we are not explicitly given a backend URL and we clearly aren't on localhost,
  // we assume we are running on Vercel and route traffic to our experimentalServices backend.
  const isLocalhost = req.headers.get("host")?.includes("localhost") || req.nextUrl.hostname === "localhost";
  if (!process.env.NEXT_PUBLIC_API_BASE_URL && !isLocalhost) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") ? `${req.headers.get("x-forwarded-proto")}:` : "https:";
    baseUrl = `${protocol}//${host}/_/backend`;
  }

  const url = `${baseUrl}/api/v1/${path.join("/")}${req.nextUrl.search}`;

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
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // If the backend returns a non-JSON response (like a 502 HTML string from Vercel),
      // we still want to forward the correct status code.
      data = { error: text };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error(`Proxy fetch failed for ${url}:`, e);
    return NextResponse.json(
      { success: false, data: null, error: { code: "PROXY_ERROR", message: String(e), url }, timestamp: new Date().toISOString() },
      { status: 502 }
    );
  }
}
