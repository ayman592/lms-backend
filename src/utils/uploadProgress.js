const clients = new Map();

// ======================================================
// ADD CLIENT
// ======================================================

export const addClient = (uploadId, res) => {
  if (!clients.has(uploadId)) {
    clients.set(uploadId, new Set());
  }

  clients.get(uploadId).add(res);
};

// ======================================================
// REMOVE CLIENT
// ======================================================

export const removeClient = (uploadId, res) => {
  const uploadClients = clients.get(uploadId);

  if (!uploadClients) return;

  uploadClients.delete(res);

  if (uploadClients.size === 0) {
    clients.delete(uploadId);
  }
};

// ======================================================
// SEND PROGRESS
// ======================================================

export const sendProgress = (uploadId, data) => {
  const uploadClients = clients.get(uploadId);

  if (!uploadClients) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of uploadClients) {
    try {
      client.write(message);
    } catch (error) {
      console.error("SSE write error:", error);

      removeClient(uploadId, client);
    }
  }
};

// ======================================================
// CLEAR UPLOAD
// ======================================================

export const clearUpload = (uploadId) => {
  const uploadClients = clients.get(uploadId);

  if (!uploadClients) return;

  for (const client of uploadClients) {
    try {
      client.end();
    } catch (error) {
      console.error("SSE close error:", error);
    }
  }

  clients.delete(uploadId);
};
