function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env.EMAILS) {
      return json({ emails: [], count: 0 });
    }

    const emailList = await env.EMAILS.get("email_list");
    const emails = emailList ? JSON.parse(emailList) : [];

    return json({ emails, count: emails.length });
  } catch {
    return json({ error: "获取失败" }, 500);
  }
}
