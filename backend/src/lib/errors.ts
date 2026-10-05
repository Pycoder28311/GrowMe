import type { ContentfulStatusCode } from 'hono/utils/http-status'

/** Throw from anywhere (repos, helpers) to answer with a clean JSON error */
export class HttpError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    message: string,
  ) {
    super(message)
  }
}
