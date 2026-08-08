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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email and get started with Hi Volley</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={BRAND.logo} alt="Hi Volley" width="150" style={logoStyle} />
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Welcome to Hi Volley. Confirm your email to unlock your assessment,
          your training plan and your progress on court.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Get started
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Didn't sign up? You can safely ignore this email.{' '}
          <Link href={BRAND.url} style={link}>
            hivolley.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
