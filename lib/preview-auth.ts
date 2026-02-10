import { createHash, timingSafeEqual } from 'crypto'

interface DraftPreviewAuthInput {
  nodeEnv?: string
  providedSecret?: string
  previewSecret?: string
}

const hasConfiguredSecret = (secret?: string): secret is string =>
  typeof secret === 'string' && secret.length > 0

const hasProvidedSecret = (secret?: string): secret is string =>
  typeof secret === 'string' && secret.length > 0

const areSecretsEqual = (providedSecret: string, previewSecret: string): boolean => {
  const providedHash = createHash('sha256').update(providedSecret, 'utf8').digest()
  const expectedHash = createHash('sha256').update(previewSecret, 'utf8').digest()
  return timingSafeEqual(providedHash, expectedHash)
}

export function canAccessDraftPreview({
  nodeEnv,
  providedSecret,
  previewSecret,
}: DraftPreviewAuthInput): boolean {
  if (nodeEnv !== 'production') {
    return true
  }

  if (!hasConfiguredSecret(previewSecret) || !hasProvidedSecret(providedSecret)) {
    return false
  }

  return areSecretsEqual(providedSecret, previewSecret)
}
