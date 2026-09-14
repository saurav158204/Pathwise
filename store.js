// Repository layer. Wraps the artifact `db`/`assets` capabilities behind a small
// interface; falls back to localStorage when a capability is unavailable so the
// app stays runnable in every viewing context (spec §20: providers must be swappable).
// NOTE on identity: this artifact has no `user` capability grant available, so there
// is no real per-viewer authentication. Each browser keeps a random "sync code" in
// localStorage that scopes db documents — convenient, NOT secure auth. Treat the
// db store itself as org-internal-shared, never a substitute for a real backend.

const LS_KEY_PROFILE_KEY = "cpip.profileKey";

function genKey() {
  return "p_" + Array.from(crypto.getRandomValues(new Uint8Array(9))).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

export class Store {
  constructor() {
    this.db = null;
    this.assets = null;
    this.downloads = null;
    this.sample = null;
    this.mode = "local"; // "cloud" once db resolves
  }

  async init() {
    try { this.db = await window.claude?.use?.("db") ?? null; } catch { this.db = null; }
    try { this.assets = await window.claude?.use?.("assets") ?? null; } catch { this.assets = null; }
    try { this.downloads = await window.claude?.use?.("downloads") ?? null; } catch { this.downloads = null; }
    try { this.sample = await window.claude?.use?.("sample") ?? null; } catch { this.sample = null; }
    this.mode = this.db ? "cloud" : "local";
    this.profileKey = localStorage.getItem(LS_KEY_PROFILE_KEY) || this._createProfileKey();
    return this;
  }

  _createProfileKey() {
    const key = genKey();
    localStorage.setItem(LS_KEY_PROFILE_KEY, key);
    return key;
  }

  setProfileKey(key) {
    this.profileKey = key.trim();
    localStorage.setItem(LS_KEY_PROFILE_KEY, this.profileKey);
  }

  _lsKey(name) { return `cpip.${name}.${this.profileKey}`; }

  async getCandidate() {
    if (this.db) {
      const snap = await this.db.doc(`candidates/${this.profileKey}`).get();
      return snap.exists ? snap.data() : null;
    }
    const raw = localStorage.getItem(this._lsKey("candidate"));
    return raw ? JSON.parse(raw) : null;
  }

  async saveCandidate(candidate) {
    const payload = { ...candidate, updatedAt: new Date().toISOString() };
    if (this.db) { await this.db.doc(`candidates/${this.profileKey}`).set(payload); return payload; }
    localStorage.setItem(this._lsKey("candidate"), JSON.stringify(payload));
    return payload;
  }

  async deleteCandidate() {
    if (this.db) { await this.db.doc(`candidates/${this.profileKey}`).delete(); return; }
    localStorage.removeItem(this._lsKey("candidate"));
  }

  async getSettings() {
    if (this.db) {
      const snap = await this.db.doc(`settings/${this.profileKey}`).get();
      return snap.exists ? snap.data() : null;
    }
    const raw = localStorage.getItem(this._lsKey("settings"));
    return raw ? JSON.parse(raw) : null;
  }

  async saveSettings(settings) {
    if (this.db) { await this.db.doc(`settings/${this.profileKey}`).set(settings); return; }
    localStorage.setItem(this._lsKey("settings"), JSON.stringify(settings));
  }

  async listApplications() {
    if (this.db) {
      const snap = await this.db.collection("applications").where("profileKey", "==", this.profileKey).get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    const raw = localStorage.getItem(this._lsKey("applications"));
    return raw ? JSON.parse(raw) : [];
  }

  async addApplication(app) {
    const payload = { ...app, profileKey: this.profileKey, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (this.db) { const ref = await this.db.collection("applications").add(payload); return { id: ref.id, ...payload }; }
    const list = await this.listApplications();
    const withId = { id: "a_" + Date.now().toString(36), ...payload };
    list.push(withId);
    localStorage.setItem(this._lsKey("applications"), JSON.stringify(list));
    return withId;
  }

  async updateApplication(id, patch) {
    const payload = { ...patch, updatedAt: new Date().toISOString() };
    if (this.db) { await this.db.collection("applications").doc(id).update(payload); return; }
    const list = await this.listApplications();
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...payload }; localStorage.setItem(this._lsKey("applications"), JSON.stringify(list)); }
  }

  async deleteApplication(id) {
    if (this.db) { await this.db.collection("applications").doc(id).delete(); return; }
    const list = (await this.listApplications()).filter((a) => a.id !== id);
    localStorage.setItem(this._lsKey("applications"), JSON.stringify(list));
  }

  async uploadResume(file) {
    if (!this.assets) return null;
    const type = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : undefined);
    const res = await this.assets.upload(file, type ? { type } : undefined);
    return res; // {id, url, sizeBytes, contentType}
  }

  async deleteResumeAsset(id) {
    if (!this.assets || !id) return;
    try { await this.assets.delete(id); } catch { /* best-effort */ }
  }
}
