import { createVerify, X509Certificate } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { initializeQzSigning, qzService } from "../../src/modules/qz/service.js";

// beforeAll(() => initializeQzSigning());

describe.skip("QZ Tray Signing Service", () => {
  it("returns the configured PEM certificate", () => {
    expect(qzService.certificate()).toContain("-----BEGIN CERTIFICATE-----");
  });

  it("creates a Base64 RSA-SHA512 signature verifiable by its certificate", () => {
    const request = "qz-tray-payload-with-exact-whitespace\n";
    const verifier = createVerify("RSA-SHA512");
    verifier.update(request, "utf8");
    verifier.end();

    expect(
      verifier.verify(new X509Certificate(qzService.certificate()).publicKey, qzService.sign(request), "base64"),
    ).toBe(true);
  });
});
