const poojaApiBaseUrl = window.location.protocol === "file:"
  ? "http://localhost:5000"
  : window.location.origin;

window.POOJA_CONFIG = {
  API_BASE_URL: poojaApiBaseUrl
};
