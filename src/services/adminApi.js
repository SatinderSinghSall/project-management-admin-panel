const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getFriendlyError(error) {
  if (!error) return "Something went wrong. Please try again.";

  if (error.name === "AbortError") {
    return "The request took too long. Check your connection and retry.";
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Your session may have expired. Please sign in again.";
    }
    if (error.status === 403) {
      return "Access denied. Your account is not authorized to use the admin panel.";
    }
    if (error.status === 404) {
      return "The requested resource was not found.";
    }
    if (error.status === 409) {
      return error.message || "This record conflicts with existing data.";
    }
    if (error.status === 422 || error.status === 400) {
      return error.message || "Please check the submitted data.";
    }
    if (error.status >= 500) {
      return "The server encountered an error. Please try again shortly.";
    }
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Cannot reach the server. Check that your backend is running and the API URL is correct.";
  }

  return error.message || "An unexpected error occurred.";
}

export function createAdminApi(getToken) {
  async function request(path, options = {}) {
    const {
      timeout = 15000,
      headers: extraHeaders = {},
      ...fetchOptions
    } = options;

    let token;

    try {
      token = await getToken();
    } catch {
      throw new ApiError(
        "Could not retrieve your session. Please sign in again.",
        401,
      );
    }

    if (!token) {
      throw new ApiError("You are not signed in. Please sign in again.", 401);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${API_URL}/api/admin${path}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
          ...extraHeaders,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      let payload = null;

      if (contentType.includes("application/json")) {
        payload = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => "");
        payload = text ? { message: text } : null;
      }

      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.error ||
          `Request failed with status ${response.status}`;

        throw new ApiError(message, response.status, payload);
      }

      return payload;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      if (error.name === "AbortError") {
        throw new ApiError(
          "The request timed out. Please check the server and retry.",
          408,
        );
      }

      if (error instanceof TypeError) {
        throw new ApiError(
          "Unable to connect to the backend. Check the server and CORS settings.",
          0,
        );
      }

      throw new ApiError(error.message || "Unexpected network error.");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    request,

    verifyAccess: () => request("/verify"),

    getOverview: () => request("/overview"),

    getRecords: (model, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(
        `/${encodeURIComponent(model)}${query ? `?${query}` : ""}`,
      );
    },

    getRecord: (model, id) =>
      request(`/${encodeURIComponent(model)}/${encodeURIComponent(id)}`),

    createRecord: (model, data) =>
      request(`/${encodeURIComponent(model)}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateRecord: (model, id, data) =>
      request(`/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    deleteRecord: (model, id, data) =>
      request(`/${encodeURIComponent(model)}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify(data),
      }),
  };
}
