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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return json({ error: "无效的邮箱地址" }, 400);
    }

    if (!env.EMAILS) {
      return json({ error: "EMAILS KV 绑定不存在" }, 500);
    }

    const emailData = {
      email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get("CF-Connecting-IP"),
      userAgent: request.headers.get("User-Agent"),
    };

    const key = `email_${Date.now()}`;
    await env.EMAILS.put(key, JSON.stringify(emailData));

    const emailListKey = "email_list";
    const existingList = await env.EMAILS.get(emailListKey);
    const emailList = existingList ? JSON.parse(existingList) : [];

    emailList.push(emailData);
    const latest = emailList.length > 1000 ? emailList.slice(-1000) : emailList;
    await env.EMAILS.put(emailListKey, JSON.stringify(latest));

    return json({
      success: true,
      message: "邮箱已保存（其实是被记录了，哈哈）",
    });
  } catch {
    return json({ error: "保存失败" }, 500);
  }
}
