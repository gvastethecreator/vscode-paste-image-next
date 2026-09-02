# Security

Paste Image Next is local-first. It does not send image data, document contents, names, paths, settings, or alt text over the network.

## Runtime boundaries

- Clipboard bytes are available only during a user-initiated VS Code paste request.
- There is no background clipboard polling, telemetry, logging, shell execution, native helper, temporary file, image decoder, or runtime dependency.
- Only PNG and JPEG signatures are accepted. SVG and other active or unknown formats are rejected.
- MIME type, supported file extension, and signature must agree when each is present.
- The default limit is 50 MiB and the configurable range is 1–100 MiB.
- Destination templates cannot expand environment variables, invoke a shell, use a URI scheme, become absolute, or traverse to a parent directory.
- Existing files are never overwritten. A late filename race fails the complete workspace edit.
- Untitled documents and read-only filesystems are rejected.
- Restricted Mode is supported because the extension does not execute workspace code.

The development toolchain has no production dependency inside the VSIX. Build and test dependencies are locked in `pnpm-lock.yaml` and reviewed through CI/package inspection.

## Reporting

Report vulnerabilities through a [private GitHub security advisory](https://github.com/gvastethecreator/vscode-paste-image-next/security/advisories/new). Do not open a public issue with exploit details.
