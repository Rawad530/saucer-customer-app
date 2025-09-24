// supabase/functions/_shared/cryptoUtils.ts

// The Public Key provided by Bank of Georgia documentation (Callback PDF)
const BOG_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

// Helper to convert Base64 string to ArrayBuffer (using built-in 'atob')
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to import the PEM key into a Web Crypto API CryptoKey
async function importPublicKey(): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = BOG_PUBLIC_KEY_PEM.substring(pemHeader.length, BOG_PUBLIC_KEY_PEM.length - pemFooter.length).replace(/\s/g, '');
  const binaryDer = base64ToArrayBuffer(pemContents);

  // Import as SPKI using RSASSA-PKCS1-v1_5 (SHA256withRSA)
  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    true,
    ["verify"]
  );
}

/**
 * Verifies the BOG Callback Signature.
 */
export async function verifyBogSignature(signatureBase64: string, rawBody: string): Promise<boolean> {
  try {
    const publicKey = await importPublicKey();
    const signatureBuffer = base64ToArrayBuffer(signatureBase64);
    const dataBuffer = new TextEncoder().encode(rawBody);

    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signatureBuffer,
      dataBuffer
    );
    return isValid;
  } catch (error) {
    console.error("Signature verification process failed:", error);
    return false;
  }
}