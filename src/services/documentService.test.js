import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('../lib/apiClient.js', () => ({ apiClient: api }))

import { createDocument, deleteDocument, getDocuments, updateDocument } from './documentService.js'

const apiDocument = {
  id: 'doc-1', userId: 'user-123', title: 'Audit Plan', description: null,
  category: 'Planning', function: 'HSSE', fileName: 'plan.pdf', fileSize: 10,
  status: 'Draft', createdAt: '2026-07-16T00:00:00Z', updatedAt: '2026-07-16T00:00:00Z',
}

describe('documentService', () => {
  beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()))

  it('loads documents and adapts API fields for the UI', async () => {
    api.get.mockResolvedValue([apiDocument])
    await expect(getDocuments()).resolves.toMatchObject([{ id: 'doc-1', user_id: 'user-123', file_name: 'plan.pdf' }])
    expect(api.get).toHaveBeenCalledWith('documents')
  })

  it('creates a document using supported API fields only', async () => {
    api.post.mockResolvedValue(apiDocument)
    await createDocument({ title: 'Audit Plan', category: 'Planning', fungsi: 'HSSE', unexpected: true })
    expect(api.post).toHaveBeenCalledWith('documents', {
      title: 'Audit Plan', description: null, category: 'Planning', function: 'HSSE',
      filePath: null, fileName: null, fileType: null, fileSize: null, status: 'Draft',
    })
  })

  it('updates a document through its id endpoint', async () => {
    api.put.mockResolvedValue({ ...apiDocument, title: 'Updated' })
    await expect(updateDocument('doc-1', { title: 'Updated' })).resolves.toMatchObject({ title: 'Updated' })
    expect(api.put).toHaveBeenCalledWith('documents/doc-1', expect.objectContaining({ title: 'Updated' }))
  })

  it('requires an id for updates and deletes', async () => {
    await expect(updateDocument('', {})).rejects.toThrow('A document id is required')
    await expect(deleteDocument('')).rejects.toThrow('A document id is required')
  })

  it('deletes by id and returns a success result', async () => {
    api.delete.mockResolvedValue(null)
    await expect(deleteDocument('doc-1')).resolves.toEqual({ success: true, id: 'doc-1' })
    expect(api.delete).toHaveBeenCalledWith('documents/doc-1')
  })
})
