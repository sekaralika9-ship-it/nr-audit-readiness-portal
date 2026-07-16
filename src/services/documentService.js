import { apiClient } from '../lib/apiClient.js'

function toUi(document) {
  return {
    id: document.id,
    user_id: document.userId,
    title: document.title,
    description: document.description,
    category: document.category,
    fungsi: document.function,
    file_path: document.filePath,
    file_name: document.fileName,
    file_type: document.fileType,
    file_size: document.fileSize,
    status: document.status,
    uploaded_by: document.uploadedBy,
    created_at: document.createdAt,
    updated_at: document.updatedAt,
  }
}

function toApi(document) {
  return {
    title: document.title,
    description: document.description || null,
    category: document.category || null,
    function: document.fungsi || null,
    filePath: document.file_path || null,
    fileName: document.file_name || null,
    fileType: document.file_type || null,
    fileSize: document.file_size || null,
    status: document.status || 'Draft',
  }
}

export async function getDocuments() {
  return (await apiClient.get('documents')).map(toUi)
}

export async function createDocument(document) {
  return toUi(await apiClient.post('documents', toApi(document)))
}

export async function updateDocument(id, updates) {
  if (!id) throw new Error('A document id is required to update a document.')
  return toUi(await apiClient.put(`documents/${id}`, toApi(updates)))
}

export async function deleteDocument(id) {
  if (!id) throw new Error('A document id is required to delete a document.')
  await apiClient.delete(`documents/${id}`)
  return { success: true, id }
}
