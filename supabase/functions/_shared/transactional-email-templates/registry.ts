/// <reference types="npm:@types/react@18.3.1" />

import type * as React from 'npm:react@18.3.1'

import { template as coachInvitation } from './coach-invitation.tsx'

export interface TemplateEntry {
  // deno-lint-ignore no-explicit-any
  component: (props: any) => React.ReactElement
  // deno-lint-ignore no-explicit-any
  subject: string | ((props: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'coach-invitation': coachInvitation,
}
