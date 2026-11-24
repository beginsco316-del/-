import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";

const maxImageBytes = 4 * 1024 * 1024;
const assetPath = /^\/managed-photos\/([a-f0-9-]{36})$/;
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const json = (data, status = 200) => Response.json(data, { status, headers });
const refused = (message, status) => json({ message }, status);
const digest = (value) => createHash("sha256").update(value).digest();

function imageType(bytes) {
  if (bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (bytes.subarray(0, 3).toString("hex") === "ffd8ff") return "image/jpeg";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

function validImage(item) {
  if (!item || typeof item.image !== "string" || item.image.length > 2048) return false;
  const image = item.image.trim();
  if (/^https?:\/\//i.test(image)) return true;
  return Boolean(image) && !/^[\\/]{2}|[:\\\x00-\x1f]/.test(image);
}

export function createHandler(storeForRequest, passwordForRequest) {
  return async function handler(request) {
    try {
      const path = new URL(request.url).pathname;
      const method = request.method;
      const match = path.match(assetPath);
      const store = storeForRequest();

      if (match && method === "GET") {
        const image = await store.getWithMetadata("images/" + match[1], { type: "arrayBuffer" });
        if (!image) return refused("사진을 찾을 수 없습니다.", 404);
        return new Response(image.data, {
          headers: {
            "Content-Type": image.metadata.type,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=31536000, immutable"
          }
        });
      }

      if (path === "/api/photo-content" && method === "GET") {
        const entry = await store.getWithMetadata("content", { type: "json" });
        return json({ content: entry?.data ?? null, revision: entry?.etag ?? null });
      }

      const password = passwordForRequest();
      if (!password || password.length < 16) {
        return refused("사진 관리자 비밀번호가 설정되지 않았습니다.", 503);
      }
      const authorization = request.headers.get("Authorization") || "";
      if (!timingSafeEqual(digest(authorization), digest("Basic " + Buffer.from("admin:" + password).toString("base64")))) {
        return refused("관리자 비밀번호를 확인해주세요.", 401);
      }

      if (path === "/api/photo-login" && method === "POST") return json({ signedIn: true });

      if (match && method === "PUT") {
        const bytes = Buffer.from(await request.arrayBuffer());
        const type = imageType(bytes);
        if (!type || bytes.length > maxImageBytes) return refused("4MB 이하 JPG, PNG, WebP 사진을 선택해주세요.", 400);
        const key = "images/" + match[1];
        const { modified } = await store.set(key, new Blob([bytes]), { onlyIfNew: true, metadata: { type } });
        if (!modified) {
          const existing = await store.get(key, { type: "arrayBuffer" });
          if (!existing || !bytes.equals(Buffer.from(existing))) return refused("사진을 다시 선택해주세요.", 409);
        }
        return json({ uploaded: true });
      }

      if (path === "/api/photo-content" && method === "PUT") {
        const raw = await request.text();
        if (Buffer.byteLength(raw) > 512000) return refused("사진 목록이 너무 큽니다.", 413);
        let input;
        try { input = JSON.parse(raw); } catch { return refused("사진 목록 형식이 올바르지 않습니다.", 400); }
        const { content, revision } = input || {};
        if (!Array.isArray(content?.photos) || !Array.isArray(content?.projects) ||
          !(revision === null || typeof revision === "string") ||
          !content.photos.every(validImage) || !content.projects.every((project) =>
            validImage(project) && (project.gallery === undefined ||
              (Array.isArray(project.gallery) && project.gallery.every(validImage))))) {
          return refused("사진 목록과 이미지 주소를 확인해주세요.", 400);
        }
        const result = await store.setJSON("content", content,
          revision === null ? { onlyIfNew: true } : { onlyIfMatch: revision });
        if (!result.modified) return refused("다른 변경 사항이 먼저 저장됐습니다. 새로고침 후 다시 수정해주세요.", 409);
        return json({ revision: result.etag });
      }

      return refused("지원하지 않는 요청입니다.", 405);
    } catch (error) {
      console.error("Photo storage operation failed", error.name);
      return refused("사진을 처리하지 못했습니다. 다시 시도해주세요.", 500);
    }
  };
}

export default createHandler(
  () => getStore({ name: "homepage-photos", consistency: "strong" }),
  () => process.env.PHOTO_ADMIN_PASSWORD
);
export const config = {
  path: ["/api/photo-login", "/api/photo-content", "/managed-photos/:id"]
};
