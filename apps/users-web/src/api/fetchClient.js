// Fetch-based HTTP client with exponential-backoff retries.
// Replaces axios + axios-retry: same call sites, no external dependency.

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status) => status === 429 || status >= 500;

export const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const failWithResponse = (data, status) => {
  const error = new Error(`request failed with status ${status}`);
  error.response = { data, status };
  return error;
};

// Returns an axios-shaped response: { data, status, headers }.
// Throws on network failure (after retries) or non-2xx status.
export const apiFetch = async (
  url,
  { method = "GET", headers = {}, body, retries = MAX_RETRIES } = {},
) => {
  let attempt = 0;

  for (;;) {
    let response = null;
    let networkError = null;

    try {
      response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      networkError = error;
    }

    const retryable =
      networkError !== null ||
      (response !== null && isRetryableStatus(response.status));

    if (retryable && attempt < retries) {
      await sleep(INITIAL_DELAY_MS * 2 ** attempt);
      attempt += 1;
      continue;
    }

    if (networkError !== null) {
      throw new Error(`network error (${networkError.message})`);
    }

    const data = await parseBody(response);

    if (!response.ok) {
      throw failWithResponse(data, response.status);
    }

    return { data, status: response.status, headers: response.headers };
  }
};
