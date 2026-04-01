import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WorkspaceInviteEmailProps {
  email: string;
  url: string;
  workspaceName: string;
  inviterName?: string;
  inviterEmail?: string;
}

export function WorkspaceInviteEmail({
  email,
  url,
  workspaceName,
  inviterName,
  inviterEmail,
}: WorkspaceInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Join {workspaceName} on OpenStore</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>OpenStore</Text>
          </Section>

          <Text style={heading}>Join {workspaceName}</Text>

          {inviterName && inviterEmail ? (
            <Text style={paragraph}>
              <strong>{inviterName}</strong> ({inviterEmail}) has invited you to
              join <strong>{workspaceName}</strong> on OpenStore.
            </Text>
          ) : (
            <Text style={paragraph}>
              You have been invited to join <strong>{workspaceName}</strong> on
              OpenStore.
            </Text>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={url}>
              Accept Invitation
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you weren&apos;t expecting this invitation, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WorkspaceInviteEmail;

const main: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '40px auto',
  padding: '40px',
  maxWidth: '480px',
};

const logoSection: React.CSSProperties = {
  marginBottom: '24px',
};

const logoText: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#111827',
  margin: '0',
};

const heading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#111827',
  margin: '0 0 16px',
};

const paragraph: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#374151',
  margin: '0 0 24px',
};

const buttonSection: React.CSSProperties = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const button: React.CSSProperties = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
};

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '0 0 16px',
};

const footer: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#6b7280',
  margin: '0',
};
