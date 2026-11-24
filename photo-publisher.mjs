const endpoint = "/api/photo-content";

export function createPublisher(password) {
  const bytes = new TextEncoder().encode("admin:" + password);
  const authorization = "Basic " + btoa(String.fromCharCode(...bytes));
  let revision;

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      cache: "no-store",
      headers: { ...options.headers, Authorization: authorization }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "사진 서버 요청에 실패했습니다.");
    return result;
  }

  return {
    async load() {
      await api("/api/photo-login", { method: "POST" });
      const result = await api(endpoint);
      revision = result.revision;
      if (result.content) return result.content;
      const baseline = await fetch("/data/site-content.json", { cache: "no-store" });
      if (!baseline.ok) throw new Error("기존 사진 목록을 불러오지 못했습니다.");
      return baseline.json();
    },
    async publish(content, uploads) {
      for (const [path, { file }] of uploads) {
        await api("/" + path, { method: "PUT", body: file });
      }
      const saved = await api(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, revision })
      });
      revision = saved.revision;
    }
  };
}
