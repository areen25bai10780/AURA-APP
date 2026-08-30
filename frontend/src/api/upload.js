import { supabase } from '../lib/supabase'

export async function uploadChatImage(file) {
  if (!file) {
    throw new Error('No file selected')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const filePath = `images/${fileName}`

  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, file)

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(filePath)

  return data.publicUrl
}