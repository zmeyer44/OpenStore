// Minimal XML builder for S3 responses — no dependencies needed

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function xmlResponse(xml: string, status = 200): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`, {
    status,
    headers: { 'Content-Type': 'application/xml' },
  });
}

export interface ListObject {
  key: string;
  lastModified: Date;
  size: number;
  etag?: string;
}

export function listObjectsV2Xml(params: {
  bucket: string;
  prefix: string;
  delimiter: string;
  maxKeys: number;
  isTruncated: boolean;
  contents: ListObject[];
  commonPrefixes: string[];
  continuationToken?: string;
  nextContinuationToken?: string;
  keyCount: number;
}): string {
  const contents = params.contents
    .map(
      (obj) => `  <Contents>
    <Key>${escapeXml(obj.key)}</Key>
    <LastModified>${obj.lastModified.toISOString()}</LastModified>
    <ETag>"${obj.etag ?? 'unknown'}"</ETag>
    <Size>${obj.size}</Size>
    <StorageClass>STANDARD</StorageClass>
  </Contents>`,
    )
    .join('\n');

  const prefixes = params.commonPrefixes
    .map((p) => `  <CommonPrefixes><Prefix>${escapeXml(p)}</Prefix></CommonPrefixes>`)
    .join('\n');

  return `<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>${escapeXml(params.bucket)}</Name>
  <Prefix>${escapeXml(params.prefix)}</Prefix>
  <Delimiter>${escapeXml(params.delimiter)}</Delimiter>
  <MaxKeys>${params.maxKeys}</MaxKeys>
  <KeyCount>${params.keyCount}</KeyCount>
  <IsTruncated>${params.isTruncated}</IsTruncated>${
    params.continuationToken
      ? `\n  <ContinuationToken>${escapeXml(params.continuationToken)}</ContinuationToken>`
      : ''
  }${
    params.nextContinuationToken
      ? `\n  <NextContinuationToken>${escapeXml(params.nextContinuationToken)}</NextContinuationToken>`
      : ''
  }
${contents}
${prefixes}
</ListBucketResult>`;
}

export function initiateMultipartUploadXml(
  bucket: string,
  key: string,
  uploadId: string,
): string {
  return `<InitiateMultipartUploadResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Bucket>${escapeXml(bucket)}</Bucket>
  <Key>${escapeXml(key)}</Key>
  <UploadId>${escapeXml(uploadId)}</UploadId>
</InitiateMultipartUploadResult>`;
}

export function completeMultipartUploadXml(
  bucket: string,
  key: string,
  etag: string,
): string {
  return `<CompleteMultipartUploadResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Bucket>${escapeXml(bucket)}</Bucket>
  <Key>${escapeXml(key)}</Key>
  <ETag>"${escapeXml(etag)}"</ETag>
</CompleteMultipartUploadResult>`;
}
