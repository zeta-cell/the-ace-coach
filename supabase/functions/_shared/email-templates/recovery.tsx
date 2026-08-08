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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Hi Volley password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={BRAND.logo} alt="Hi Volley" width="150" style={logoStyle} />
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your Hi Volley password. Choose a new
          one with the button below.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Set new password
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Didn't request this? Your password stays unchanged.{' '}
          <Link href={BRAND.url} style={link}>
            hivolley.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
