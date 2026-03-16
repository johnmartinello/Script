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

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      if (!width || !height) {
        reject(new Error('Could not read image dimensions'))
        return
      }
      resolve({ width, height })
    }
    img.onerror = () => reject(new Error('Could not load image dimensions'))
    img.src = dataUrl
  })
}

export function fitImageIntoBounds(
  original: { width: number; height: number },
  bounds: { maxWidth: number; maxHeight: number }
): { width: number; height: number } {
  const scale = Math.min(
    bounds.maxWidth / original.width,
    bounds.maxHeight / original.height,
    1
  )
  return {
    width: Math.max(80, Math.round(original.width * scale)),
    height: Math.max(80, Math.round(original.height * scale)),
  }
}
