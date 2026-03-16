export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read image file'))
        return
      }
      resolve(reader.result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image file'))
    reader.readAsDataURL(file)
  })
}

export function getImageFileFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items
  if (!items) return null
  for (const item of items) {
    if (!item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (file) return file
  }
  return null
}
