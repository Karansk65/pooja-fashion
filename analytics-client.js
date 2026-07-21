(function(){
  const visitorKey = "poojaVisitorId";
  const sessionKey = "poojaSessionId";

  function createId(prefix){
    const random = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    return prefix + "-" + Date.now().toString(36) + "-" + random;
  }

  function getId(storage, key, prefix){
    let value = storage.getItem(key);
    if(!value){
      value = createId(prefix);
      storage.setItem(key, value);
    }
    return value;
  }

  function track(eventType, details = {}){
    if(!window.PoojaApi?.isEnabled()) return;
    const payload = {
      event_type:eventType,
      visitor_id:getId(localStorage, visitorKey, "visitor"),
      session_id:getId(sessionStorage, sessionKey, "session"),
      page:window.location.pathname,
      product_name:details.productName || "",
      product_slug:details.productSlug || ""
    };

    window.PoojaApi.request("/api/analytics/event", {
      method:"POST",
      body:JSON.stringify(payload)
    }).catch(() => {});
  }

  window.PoojaAnalytics = { track };
  track("page_view");
  window.setInterval(() => track("heartbeat"), 60000);
})();
