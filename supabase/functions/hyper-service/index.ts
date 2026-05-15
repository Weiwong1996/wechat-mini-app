// Supabase Edge: 微信登录 → 必须使用「项目 JWT Secret」签发 access_token，PostgREST 才能验证（勿用 SERVICE_ROLE_KEY 作为签名密钥）
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignJWT } from 'npm:jose@5'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

/**
 * 与 API 网关/PostgREST 使用同一 JWT Secret（Dashboard → Settings → API → JWT Secret）。
 * 在 Dashboard → Edge Functions → Secrets 添加 JWT_SECRET（或部分环境提供 SUPABASE_JWT_SECRET）。
 * 切勿用 SERVICE_ROLE_KEY 当作 HMAC secret 签用户会话 —— 会导致 PGRST301。
 */
async function signAccessToken(userId: string): Promise<string> {
  const raw =
    Deno.env.get('SUPABASE_JWT_SECRET') ?? Deno.env.get('JWT_SECRET')
  if (!raw || raw.trim() === '') {
    throw new Error(
      'Missing JWT_SECRET: add Edge secret JWT_SECRET = project JWT Secret (Settings → API)',
    )
  }
  const secret = new TextEncoder().encode(raw.trim())
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`

  return new SignJWT({
    sub: userId,
    role: 'authenticated',
    aud: 'authenticated',
    app_id: supabaseUrl.split('//')[1].split('.')[0],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret)
}

async function code2Session(code: string, appid: string, secret: string) {
  const qs = new URLSearchParams({
    appid,
    secret,
    js_code: code,
    grant_type: 'authorization_code',
  })
  const url = `https://api.weixin.qq.com/sns/jscode2session?${qs.toString()}`
  const res = await fetch(url)
  return res.json()
}

Deno.serve(async (req) => {
  try {
    const { code } = await req.json()
    if (!code) {
      return Response.json({ error: 'Missing wechat code' }, { status: 400 })
    }

    const wxData = await code2Session(
      code,
      Deno.env.get('WX_APPID')!,
      Deno.env.get('WX_SECRET')!,
    )
    if (wxData.errcode) throw new Error(`WeChat error: ${wxData.errmsg}`)
    const { openid } = wxData

    const { data: existing, error: queryErr } = await supabaseAdmin
      .from('wechat_identities')
      .select('id, openid')
      .eq('openid', openid)
      .maybeSingle()
    if (queryErr) throw queryErr

    let userId: string

    if (existing) {
      userId = existing.id
    } else {
      const { data: newUser, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          password: crypto.randomUUID(),
          user_metadata: { wx_openid: openid, provider: 'wechat' },
          email: `${openid}@wechat.miniapp`,
          email_confirm: true,
        })
      if (createErr) throw createErr
      userId = newUser.user.id

      const { error: upsertErr } = await supabaseAdmin
        .from('wechat_identities')
        .upsert([{ id: userId, openid }], { onConflict: 'id' })
      if (upsertErr) throw upsertErr
    }

    const accessToken = await signAccessToken(userId)
    const refreshToken = crypto.randomUUID()

    await supabaseAdmin.from('refresh_tokens').upsert(
      [
        {
          user_id: userId,
          token: refreshToken,
          expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        },
      ],
      { onConflict: 'user_id' },
    )

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('wechat_identities')
      .select('id, openid')
      .eq('id', userId)
      .single()
    if (profileErr) throw profileErr

    return Response.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 7200,
      user: {
        id: profile.id,
        openid: profile.openid,
      },
    })
  } catch (err) {
    console.error('hyper-service error:', err)
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
})
