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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Hi Volley login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={BRAND.logo} alt="Hi Volley" width="150" style={logoStyle} />
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Tap the button below to log in to Hi Volley. The link expires shortly,
          so use it while it's warm.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log in
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Didn't request this link? You can safely ignore this email.{' '}
          <Link href={BRAND.url} style={link}>
            hivolley.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
