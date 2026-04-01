import { xmlResponse } from './xml';

function errorXml(code: string, message: string, resource?: string): string {
  return `<Error>
  <Code>${code}</Code>
  <Message>${message}</Message>${resource ? `\n  <Resource>${resource}</Resource>` : ''}
  <RequestId>0</RequestId>
</Error>`;
}

export function accessDenied(resource?: string): Response {
  return xmlResponse(errorXml('AccessDenied', 'Access Denied', resource), 403);
}

export function noSuchBucket(bucket: string): Response {
  return xmlResponse(errorXml('NoSuchBucket', 'The specified bucket does not exist', bucket), 404);
}

export function noSuchKey(key: string): Response {
  return xmlResponse(errorXml('NoSuchKey', 'The specified key does not exist.', key), 404);
}

export function invalidRequest(message: string): Response {
  return xmlResponse(errorXml('InvalidRequest', message), 400);
}

export function internalError(message = 'Internal server error'): Response {
  return xmlResponse(errorXml('InternalError', message), 500);
}

export function quotaExceeded(): Response {
  return xmlResponse(errorXml('QuotaExceeded', 'Storage quota exceeded'), 507);
}

export function methodNotAllowed(): Response {
  return xmlResponse(errorXml('MethodNotAllowed', 'The specified method is not allowed'), 405);
}

export function noSuchUpload(): Response {
  return xmlResponse(errorXml('NoSuchUpload', 'The specified multipart upload does not exist.'), 404);
}
