import { supabase, supabaseConfigError } from '../lib/supabaseClient.js'

const writableColumns = [
  'title',
  'description',
  'category',
  'fungsi',
  'file_path',
  'file_name',
  'file_type',
  'file_size',
  'status',
]

function requireSupabase() {
  if (supabaseConfigError || !supabase) {
    throw new Error(supabaseConfigError || 'Supabase is not connected.')
  }
}

function readableError(action, error) {
  console.error(`Supabase documents ${action} failed:`, error)
  return new Error(`Unable to ${action} document in documents: ${error.message}`)
}

function pickDocumentColumns(document) {
  return writableColumns.reduce((payload, column) => {
    if (Object.prototype.hasOwnProperty.call(document, column)) {
      payload[column] = document[column] === '' ? null : document[column]
    }
    return payload
  }, {})
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Unable to read the authenticated user for documents:', error)
    throw new Error(`Unable to verify the current user: ${error.message}`)
  }

  return user
}

export async function getDocuments() {
  requireSupabase()

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw readableError('load', error)
  return data ?? []
}

export async function createDocument(document) {
  requireSupabase()

  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error('You must be signed in to create a document.')
  }

  const payload = {
    ...pickDocumentColumns(document),
    user_id: user.id,
    uploaded_by: user.id,
  }

  const { data, error } = await supabase
    .from('documents')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw readableError('create', error)
  return data
}

export async function updateDocument(id, updates) {
  requireSupabase()
  if (!id) throw new Error('A document id is required to update a document.')

  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error('You must be signed in to update a document.')
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      ...pickDocumentColumns(updates),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw readableError('update', error)
  return data
}

export async function deleteDocument(id) {
  requireSupabase()
  if (!id) throw new Error('A document id is required to delete a document.')

  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error('You must be signed in to delete a document.')
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (error) throw readableError('delete', error)
  return { success: true, id }
}
