import { createPrivateKey, createPublicKey, createSign, X509Certificate, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "../../config/env.js";

const loadSigningMaterial = (): { certificate: string; privateKey: KeyObject } => {
  try {
    const certificatePath = resolve(env.QZ_CERTIFICATE_PATH);
    const privateKeyPath = resolve(env.QZ_PRIVATE_KEY_PATH);
    const certificate = readFileSync(certificatePath, "utf8");
    const privateKey = createPrivateKey(readFileSync(privateKeyPath, "utf8"));

    // Fail startup when an accidentally mismatched certificate/key pair is
    // configured; QZ otherwise fails later with a difficult-to-diagnose error.
    const certificateKey = new X509Certificate(certificate).publicKey.export({ type: "spki", format: "der" });
    const privateKeyPublicPart = createPublicKey(privateKey).export({ type: "spki", format: "der" });
    if (!certificateKey.equals(privateKeyPublicPart)) {
      throw new Error("certificate and private key do not match");
    }

    console.log("QZ Tray signing material loaded");
    return { certificate, privateKey };
  } catch (error) {
    console.error("Unable to load QZ Tray signing material. Aborting startup.");
    throw error;
  }
};

let signingMaterial: { certificate: string; privateKey: KeyObject } | undefined;

// Called by the production server before it accepts traffic. Keeping this
// explicit lets isolated route tests construct an app without requiring a
// deployment secret, while the actual server still fails fast on bad material.
export const initializeQzSigning = () => {
  if (!signingMaterial) signingMaterial = loadSigningMaterial();
};

const getSigningMaterial = () => {
  if (!signingMaterial) {
    throw new Error("QZ signing material was not initialized");
  }
  return signingMaterial;
};

export const qzService = {
  certificate: () => getSigningMaterial().certificate,

  sign: (request: string) => {
    const signer = createSign("RSA-SHA512");
    signer.update(request, "utf8");
    signer.end();
    return signer.sign(getSigningMaterial().privateKey, "base64");
  },
};
