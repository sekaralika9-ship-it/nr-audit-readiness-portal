import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    from: mocks.from,
    auth: { getUser: mocks.getUser },
  },
  supabaseConfigError: null,
}))

import {
  createDocument,
  deleteDocument,
  getDocuments,
  updateDocument,
} from './documentService.js'

describe('documentService', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.getUser.mockReset()
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
  })

  it('loads documents newest first and converts null data to an empty array', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: null })
    const select = vi.fn().mockReturnValue({ order })
    mocks.from.mockReturnValue({ select })

    await expect(getDocuments()).resolves.toEqual([])
    expect(mocks.from).toHaveBeenCalledWith('documents')
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('creates a document with valid columns and authenticated ownership only', async () => {
    const inserted = { id: 'doc-1', title: 'Audit Plan' }
    const single = vi.fn().mockResolvedValue({ data: inserted, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mocks.from.mockReturnValue({ insert })

    await expect(
      createDocument({
        title: 'Audit Plan',
        description: '',
        category: 'Planning Document',
        status: 'Draft',
        unexpected: 'must not be sent',
      }),
    ).resolves.toEqual(inserted)

    expect(insert).toHaveBeenCalledWith({
      title: 'Audit Plan',
      description: null,
      category: 'Planning Document',
      status: 'Draft',
      user_id: 'user-123',
      uploaded_by: 'user-123',
    })
  })

  it('rejects creation when no user is authenticated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(createDocument({ title: 'Plan' })).rejects.toThrow(
      'You must be signed in to create a document.',
    )
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('updates valid fields, id, and updated_at', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'doc-1', title: 'Updated' },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    mocks.from.mockReturnValue({ update })

    await updateDocument('doc-1', { title: 'Updated', unknown: true })

    const payload = update.mock.calls[0][0]
    expect(payload).toMatchObject({ title: 'Updated' })
    expect(payload.updated_at).toBeTruthy()
    expect(payload).not.toHaveProperty('unknown')
    expect(eq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('deletes by id and returns a clear success result', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const remove = vi.fn().mockReturnValue({ eq })
    mocks.from.mockReturnValue({ delete: remove })

    await expect(deleteDocument('doc-1')).resolves.toEqual({ success: true, id: 'doc-1' })
    expect(eq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('includes table and action details in request errors', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'RLS denied' },
    })
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ order }) })

    await expect(getDocuments()).rejects.toThrow(
      'Unable to load document in documents: RLS denied',
    )
  })
})
