const livePoojaApiBaseUrl = "https://poojafashionstore.com";
const localPoojaApiBaseUrl = "http://localhost:5000";
const savedPoojaApiBaseUrl = localStorage.getItem("poojaApiBaseUrl");
const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const isBackendPreview = isLocalPreview && window.location.port === "5000";
const usableSavedPoojaApiBaseUrl =
  savedPoojaApiBaseUrl && (isBackendPreview || !savedPoojaApiBaseUrl.includes("localhost:5000"))
    ? savedPoojaApiBaseUrl
    : "";

const poojaApiBaseUrl = usableSavedPoojaApiBaseUrl ||
  (window.location.protocol === "file:"
    ? localPoojaApiBaseUrl
    : isBackendPreview
      ? localPoojaApiBaseUrl
      : isLocalPreview
        ? livePoojaApiBaseUrl
        : window.location.origin);

window.POOJA_CONFIG = {
  API_BASE_URL: poojaApiBaseUrl,
  API_HOST_LABEL: new URL(poojaApiBaseUrl).host
};
