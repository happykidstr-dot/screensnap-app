import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface TranscriptSegment {
  text: string;
  startTime: number; // seconds into the recording
}

export interface TimestampComment {
  id: string;
  time: number;       // seconds into the video
  emoji?: string;
  text?: string;
  createdAt: number;
}

export interface VideoReaction {
  id: string;
  time: number;
  blob: Blob;
  createdAt: number;
}

export interface Chapter {
  id: string;
  time: number;   // seconds into the recording
  label: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  blob: Blob;
  duration: number;
  size: number;
  createdAt: number;
  thumbnail?: string;
  tags?: string[];
  folder?: string;
  transcript?: TranscriptSegment[];
  comments?: TimestampComment[];
  chapters?: Chapter[];
  cloudUrl?: string;    // Supabase public URL after upload
  aiSummary?: string;   // AI-generated summary
  aiKeyPoints?: string[];
  aiEmailDraft?: string; // AI generated email draft
  aiWikiDocument?: string; // AI generated Wiki/Notion markdown
  cta?: { text: string; url: string; }; // Interactive CTA button
  reactions?: VideoReaction[]; // Async video reactions
  password?: string; // Şifreli paylaşım için
  workspace?: string; // Multi-tenant Team Workspace için
}

interface LoomDB extends DBSchema {
  videos: {
    key: string;
    value: VideoRecord;
    indexes: { 'by-date': number; 'by-folder': string };
  };
}

let dbPromise: Promise<IDBPDatabase<LoomDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') throw new Error('IndexedDB is only available in the browser');
  if (!dbPromise) {
    dbPromise = openDB<LoomDB>('screensnap-db', 3, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('videos', { keyPath: 'id' });
          store.createIndex('by-date', 'createdAt');
        }
        if (oldVersion < 3) {
          // Attempt to add folder index - may already exist if upgrading
          try {
            transaction.objectStore('videos').createIndex('by-folder', 'folder');
          } catch { /* index may already exist, safe to ignore */ }
        }
      },
    });
  }
  return dbPromise;
}

export async function saveVideo(record: VideoRecord): Promise<void> {
  const db = await getDB();
  await db.put('videos', record);
}

export async function getAllVideos(): Promise<VideoRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('videos', 'by-date');
  return all.reverse();
}

export async function getVideo(id: string): Promise<VideoRecord | undefined> {
  const db = await getDB();
  return db.get('videos', id);
}

export async function deleteVideo(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('videos', id);
}

export async function updateVideoTitle(id: string, title: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.title = title; await db.put('videos', record); }
}

export async function updateVideoTags(id: string, tags: string[]): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.tags = tags; await db.put('videos', record); }
}

export async function updateVideoFolder(id: string, folder: string | undefined): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.folder = folder; await db.put('videos', record); }
}

export async function updateVideoComments(id: string, comments: TimestampComment[]): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.comments = comments; await db.put('videos', record); }
}

export async function updateVideoThumbnail(id: string, thumbnail: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.thumbnail = thumbnail; await db.put('videos', record); }
}

export async function updateVideoCloudUrl(id: string, cloudUrl: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.cloudUrl = cloudUrl; await db.put('videos', record); }
}

export async function getAllFolders(): Promise<string[]> {
  const db = await getDB();
  const all = await db.getAll('videos');
  const folders = [...new Set(all.map(v => v.folder).filter(Boolean))] as string[];
  return folders.sort();
}

export async function getAllWorkspaces(): Promise<string[]> {
  const db = await getDB();
  const all = await db.getAll('videos');
  const workspaces = [...new Set(all.map(v => v.workspace).filter(Boolean))] as string[];
  return workspaces.sort();
}

export async function updateVideoChapters(id: string, chapters: Chapter[]): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.chapters = chapters; await db.put('videos', record); }
}

export async function updateVideoAI(id: string, summary: string, keyPoints: string[], emailDraft: string, wikiDocument?: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { 
    record.aiSummary = summary; 
    record.aiKeyPoints = keyPoints; 
    record.aiEmailDraft = emailDraft; 
    if (wikiDocument) record.aiWikiDocument = wikiDocument;
    await db.put('videos', record); 
  }
}

export async function addVideoReaction(id: string, reaction: VideoReaction): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) {
    if (!record.reactions) record.reactions = [];
    record.reactions.push(reaction);
    await db.put('videos', record);
  }
}

export async function updateVideoCTA(id: string, cta: { text: string; url: string } | undefined): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.cta = cta; await db.put('videos', record); }
}

export async function updateVideoPassword(id: string, password?: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.password = password; await db.put('videos', record); }
}

export async function updateVideoWorkspace(id: string, workspace: string | undefined): Promise<void> {
  const db = await getDB();
  const record = await db.get('videos', id);
  if (record) { record.workspace = workspace; await db.put('videos', record); }
}
