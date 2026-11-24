const repository = "https://api.github.com/repos/beginsco316-del/-";
const contentPath = "data/site-content.json";

export function createPublisher(token, request = fetch) {
  async function github(path, { method = "GET", body, raw = false } = {}) {
    const response = await request(repository + path, {
      method,
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + token,
        Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(response.status === 401 || response.status === 403
        ? "GitHub 토큰과 저장소 콘텐츠 권한을 확인해주세요."
        : "GitHub 요청에 실패했습니다 (" + response.status + "). 다시 시도해주세요.");
    }
    return response.json();
  }

  const head = async () => (await github("/git/ref/heads/main")).object.sha;
  let base;
  return {
    async load() {
      base = await head();
      return github("/contents/" + contentPath + "?ref=" + base, { raw: true });
    },
    async publish(content, uploads) {
      if (await head() !== base) {
        throw new Error("저장소에 새 변경 사항이 있습니다. 새로고침 후 다시 수정해주세요.");
      }
      const { tree } = await github("/git/commits/" + base);
      const files = [];
      for (const [path, { file }] of uploads) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let start = 0; start < bytes.length; start += 16384) {
          binary += String.fromCharCode(...bytes.subarray(start, start + 16384));
        }
        const blob = await github("/git/blobs", {
          method: "POST",
          body: { content: btoa(binary), encoding: "base64" }
        });
        files.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      }
      files.push({
        path: contentPath, mode: "100644", type: "blob",
        content: JSON.stringify(content, null, 2) + "\n"
      });
      const updatedTree = await github("/git/trees", {
        method: "POST", body: { base_tree: tree.sha, tree: files }
      });
      const commit = await github("/git/commits", {
        method: "POST",
        body: { message: "Update homepage photos", tree: updatedTree.sha, parents: [base] }
      });
      await github("/git/refs/heads/main", {
        method: "PATCH", body: { sha: commit.sha, force: false }
      });
      base = commit.sha;
      return commit.sha;
    }
  };
}
