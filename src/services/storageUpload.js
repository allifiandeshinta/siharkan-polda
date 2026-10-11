import supabase from '../lib/supabase'

const BUCKET = 'siharkan-tik'

export async function uploadFile(file, folder = 'uploads') {
  const fileExt = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600'
    })
  
  if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName)

  return {
    url: urlData.publicUrl,
    path: fileName,
    size: file.size,
    type: file.type,
    name: file.name
  }
}

export async function deleteFile(filePath) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath])
  
  if (error) throw new Error(`Delete error: ${error.message}`)
  return { success: true, path: filePath }
}

export async function validateFile(file) {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']
  
  if (file.size > MAX_SIZE) {
    throw new Error(`File size exceeds 10MB (current: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB)`)  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File type '${ext}' not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)  }

  return true
}

export async function uploadAndValidate(file, folder = 'uploads') {
  await validateFile(file)
  return await uploadFile(file, folder)
}

export async function getUploadUrl(path) {
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)
  return urlData.publicUrl
}

export async function batchDelete(paths) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove(paths)
  if (error) throw new Error(`Batch delete error: ${error.message}`)
  return { success: true, paths }
}