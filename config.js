const livePoojaApiBaseUrl = "https://pooja-fashion.onrender.com";
const localPoojaApiBaseUrl = "http://localhost:5000";
const savedPoojaApiBaseUrl = localStorage.getItem("poojaApiBaseUrl");
const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const poojaApiBaseUrl = savedPoojaApiBaseUrl ||
  (window.location.protocol === "file:"
    ? localPoojaApiBaseUrl
    : isLocalPreview
      ? livePoojaApiBaseUrl
      : window.location.origin);

window.POOJA_CONFIG = {
  API_BASE_URL: poojaApiBaseUrl,
  API_HOST_LABEL: new URL(poojaApiBaseUrl).host
};
