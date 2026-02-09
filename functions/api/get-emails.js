function buildCorsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN;
  const corsOrigin =
    allowedOrigin && origin === allowedOrigin ? allowedOrigin : "null";

  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function readAdminToken(request) {
  const auth = request.headers.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  const url = new URL(request.url);
  return (url.searchParams.get("token") || "").trim();
}

export async function onRequestOptions(context) {
  const corsHeaders = buildCorsHeaders(context.request, context.env);
  return new Response(null, {
    headers: corsHeaders,
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const corsHeaders = buildCorsHeaders(request, env);

  try {
    if (!env.ADMIN_TOKEN) {
      return json({ error: "服务端未配置 ADMIN_TOKEN" }, 500, corsHeaders);
    }

    const providedToken = readAdminToken(request);
    if (!providedToken || providedToken !== env.ADMIN_TOKEN) {
      return json({ error: "未授权" }, 401, corsHeaders);
    }

    if (!env.EMAILS) {
      return json({ emails: [], count: 0 }, 200, corsHeaders);
    }

    const emailList = await env.EMAILS.get("email_list");
    const emails = emailList ? JSON.parse(emailList) : [];

    return json({ emails, count: emails.length }, 200, corsHeaders);
  } catch {
    return json({ error: "获取失败" }, 500, corsHeaders);
  }
}
