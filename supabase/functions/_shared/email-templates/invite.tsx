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
} from './brand.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your coach invited you to Hi Volley</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={BRAND.logo} alt="Hi Volley" width="150" style={logoStyle} />
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          Your coach invited you to Hi Volley. Accept the invitation to see your
          assessment, your development curve and your upcoming sessions.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept invitation
        </Button>
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

export default InviteEmail
