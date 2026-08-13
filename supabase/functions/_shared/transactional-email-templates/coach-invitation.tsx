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
  Link,
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
  link,
  logoStyle,
  main,
  text,
} from '../email-templates/brand.ts'

interface Props {
  coachName?: string
  academyName?: string | null
  message?: string | null
  inviteUrl?: string
}

const CoachInvitationEmail = ({
  coachName = 'your coach',
  academyName,
  message,
  inviteUrl = BRAND.url,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{coachName} invited you to Hi Volley — set up your player profile</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={BRAND.logo} alt="Hi Volley" width="150" style={logoStyle} />
        <Heading style={h1}>{coachName} invited you</Heading>
        <Text style={text}>
          {academyName
            ? `You trained with ${coachName} at ${academyName}.`
            : `You trained with ${coachName}.`}{' '}
          Set up your Hi Volley profile so your coach can share your camp assessment,
          your shot levels and your development curve with you.
        </Text>
        {message ? <Text style={text}>“{message}”</Text> : null}
        <Button style={button} href={inviteUrl}>
          Set up my profile
        </Button>
        <Text style={{ ...text, margin: '22px 0 0', fontSize: '13px' }}>
          It takes about a minute — you only choose a password.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Weren't expecting this? You can safely ignore this email.{' '}
          <Link href={BRAND.url} style={link}>
            hivolley.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CoachInvitationEmail,
  subject: 'Your coach invited you to Hi Volley',
  displayName: 'Coach invitation',
  previewData: {
    coachName: 'Pedro Sousa Martinez',
    academyName: 'Tio Tio Padel Academy',
    message: 'To put your assessment into the app I need you to register.',
    inviteUrl: 'https://hivolley.com/invite/demo',
  },
} satisfies TemplateEntry

export default CoachInvitationEmail
