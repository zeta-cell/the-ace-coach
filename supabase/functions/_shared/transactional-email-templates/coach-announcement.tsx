/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'
import {
  BRAND,
  button,
  container,
  footer,
  h1,
  hr,
  logoStyle,
  main,
  text,
} from '../email-templates/brand.ts'

interface Props {
  coachName?: string
  coachAvatarUrl?: string | null
  headline?: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
  detailLines?: string[]
}

const CoachAnnouncementEmail = ({
  coachName = 'Your coach',
  coachAvatarUrl,
  headline = 'New session available',
  message = '',
  ctaLabel = 'View details',
  ctaUrl = BRAND.url,
  detailLines = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${coachName}: ${headline}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={BRAND.logo} alt="Hi Volley" width="150" style={logoStyle} />
        {coachAvatarUrl ? (
          <Img
            src={coachAvatarUrl}
            alt={coachName}
            width="72"
            height="72"
            style={{ width: '72px', height: '72px', borderRadius: '36px', objectFit: 'cover', margin: '0 0 18px' }}
          />
        ) : null}
        <Heading style={h1}>{headline}</Heading>
        <Text style={{ ...text, margin: '0 0 14px' }}>
          <strong style={{ color: BRAND.navy }}>{coachName}</strong> sent you this update:
        </Text>
        {message
          ? message.split('\n').filter(Boolean).map((line, i) => (
              <Text key={i} style={{ ...text, margin: '0 0 10px' }}>{line}</Text>
            ))
          : null}
        {detailLines.length > 0 ? (
          <Container style={{ backgroundColor: '#F4EFE6', borderRadius: '12px', padding: '14px 16px', margin: '8px 0 22px' }}>
            {detailLines.map((d, i) => (
              <Text key={i} style={{ ...text, margin: '0 0 6px', color: BRAND.navy, fontSize: '14px' }}>{d}</Text>
            ))}
          </Container>
        ) : null}
        <Button href={ctaUrl} style={button}>{ctaLabel}</Button>
        <Hr style={hr} />
        <Text style={footer}>Hi Volley — train smarter, play better.</Text>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: CoachAnnouncementEmail,
  displayName: 'Coach Announcement',
  subject: (props: Props) => `${props.coachName || 'Your coach'}: ${props.headline || 'New session available'}`,
  previewData: {
    coachName: 'Pedro Sousa Martinez',
    headline: 'Padel Clinic — Saturday 10:00',
    message: 'Two spots left for this weekend’s clinic. Bring water and your best smash.',
    ctaLabel: 'Reserve my spot',
    ctaUrl: 'https://hivolley.com/events',
    detailLines: ['Sat 22 Aug · 10:00–12:00', 'Tio Tio Padel Academy', '€25 per person'],
  },
}
