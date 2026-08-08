/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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
  codeStyle,
  container,
  footer,
  h1,
  hr,
  link,
  logoStyle,
  main,
  text,
} from './brand.ts'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Hi Volley verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={BRAND.logo} alt="Hi Volley" width="150" style={logoStyle} />
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code expires shortly. Didn't request it? Ignore this email.{' '}
          <Link href={BRAND.url} style={link}>
            hivolley.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
