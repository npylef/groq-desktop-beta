const fs = require('fs');
const path = require('path');

let appInstance;
let conversationsDir;

function init(app) {
  appInstance = app;
  const userData = app.getPath('userData');
  conversationsDir = path.join(userData, 'conversations');
  if (!fs.existsSync(conversationsDir)) {
    fs.mkdirSync(conversationsDir, { recursive: true });
  }
}

function getConversationPath(id) {
  if (!conversationsDir) throw new Error('chatHistory not initialized');
  return path.join(conversationsDir, `${id}.json`);
}

function listConversations() {
  if (!conversationsDir) return [];
  const files = fs.readdirSync(conversationsDir);
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const file = path.join(conversationsDir, f);
      const stat = fs.statSync(file);
      let title = f.replace(/\.json$/, '');
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (data && data.title) title = data.title;
      } catch {}
      return { id: f.replace(/\.json$/, ''), title, updated: stat.mtimeMs };
    })
    .sort((a, b) => b.updated - a.updated);
}

function loadConversation(id) {
  const file = getConversationPath(id);
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return { messages: data.messages || [], title: data.title || id };
    } catch {
      return { messages: [], title: id };
    }
  }
  return { messages: [], title: id };
}

function saveConversation(id, messages, title) {
  const file = getConversationPath(id);
  const data = { messages, title };
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function createConversation() {
  const id = `conv-${Date.now()}`;
  saveConversation(id, [], id);
  return id;
}

function importConversation(file) {
  if (!fs.existsSync(file)) {
    throw new Error('File does not exist');
  }
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const id = `conv-${Date.now()}`;
    const messages = data.messages || [];
    const title = data.title || id;
    saveConversation(id, messages, title);
    return id;
  } catch (err) {
    console.error('Failed to import conversation', err);
    return null;
  }
}

module.exports = {
  init,
  listConversations,
  loadConversation,
  saveConversation,
  createConversation,
  importConversation,
};
