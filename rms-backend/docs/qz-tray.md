# QZ Tray signing API

The backend exposes the certificate and signing URLs required for QZ Tray silent printing.

## `GET /api/qz/certificate`

Returns the configured PEM certificate as `text/plain; charset=utf-8`. A valid `Authorization: Bearer <access-token>` header is required. It is cacheable for one day.

## `POST /api/qz/sign`

Requires a valid `Authorization: Bearer <access-token>` header, a company context, and the existing `printer:read` permission. This permission restriction prevents users without printer access from authorizing a QZ Tray print.

Send JSON with the exact QZ request string:

```json
{
  "request": "the exact string supplied by QZ Tray"
}
```

Successful responses are JSON:

```json
{
  "signature": "base64-rsa-sha512-signature"
}
```

The server signs the request bytes with RSA-SHA512. The client must return the `signature` field itself from its QZ signature promise. Do not trim or otherwise change the QZ request string before sending it.

Invalid content types, malformed JSON, empty requests, unexpected fields, and requests exceeding `QZ_MAX_SIGN_REQUEST_BYTES` (64 KiB by default) return `400`. Missing or invalid JWTs return `401`; insufficient printer permission returns `403`; signing failures return a generic `500` response without crypto details.

## Deployment configuration

Set these environment variables to paths available only to the backend process:

```dotenv
QZ_CERTIFICATE_PATH=certificates/digital-certificate.txt
QZ_PRIVATE_KEY_PATH=certificates/private-key.pem
QZ_MAX_SIGN_REQUEST_BYTES=65536
```

`private-key.pem` is deliberately ignored by Git and must be deployed through the platform's secret mechanism or a protected volume. The server validates that the certificate and private key match during startup and refuses to listen if they do not.
