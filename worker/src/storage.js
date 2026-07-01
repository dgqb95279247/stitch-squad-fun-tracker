export async function putAttachmentObject(bucket, objectKey, file) {
  await bucket.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream'
    }
  });

  return objectKey;
}

export async function streamAttachmentObject(bucket, objectKey) {
  return bucket.get(objectKey);
}
