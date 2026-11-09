const NAME_MIN = 2;
const NAME_MAX = 160;
const EMAIL_MAX = 254;
const PHONE_MAX = 32;

export function validateLead(input) {
  const fullName = String(input?.fullName ?? '').trim().replace(/\s+/g, ' ');
  const email = String(input?.email ?? '').trim().toLocaleLowerCase('pt-BR');
  const phone = String(input?.phone ?? '').trim();
  if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) return { ok: false, message: 'Informe seu nome completo.' };
  if (email.length < 5 || email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Confira o endereço de e-mail.' };
  if (phone.length < 7 || phone.length > PHONE_MAX || !/^[+0-9() .-]+$/.test(phone)) return { ok: false, message: 'Confira o telefone com DDD.' };
  return { ok: true, lead: { full_name: fullName, email, phone } };
}

function getLeadConfig() {
  const endpoint = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  const turnstileSiteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim();
  if (!endpoint || !publishableKey || !turnstileSiteKey) return null;
  let url;
  try { url = new URL(endpoint); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
  return { baseUrl: url.toString().replace(/\/$/, ''), publishableKey, turnstileSiteKey };
}

export function isLeadRegistrationConfigured() {
  return Boolean(getLeadConfig());
}

export function getTurnstileSiteKey() {
  return getLeadConfig()?.turnstileSiteKey ?? '';
}

export async function submitLead(input, turnstileToken) {
  const validated = validateLead(input);
  if (!validated.ok) return validated;
  if (!String(turnstileToken ?? '').trim()) return { ok: false, message: 'Conclua a verificação antispam para continuar.' };
  const config = getLeadConfig();
  if (!config) return { ok: false, message: 'O cadastro inicial ainda não está configurado. Tente novamente mais tarde.' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${config.baseUrl}/functions/v1/renate-lead-registration`, {
      method: 'POST',
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...validated.lead, turnstile_token: turnstileToken }),
      signal: controller.signal,
    });
    let result = {};
    try { result = await response.json(); } catch {}
    if (response.ok && result.already_registered) return { ok: true, alreadyRegistered: true, message: 'Este e-mail já consta no cadastro inicial. Você pode continuar.' };
    if (!response.ok) return { ok: false, message: 'Não foi possível concluir o cadastro. Verifique sua conexão e tente novamente.' };
    return { ok: true };
  } catch {
    return { ok: false, message: controller.signal.aborted ? 'O cadastro demorou demais. Verifique sua conexão e tente novamente.' : 'Sem conexão com o cadastro inicial. Conecte-se à internet e tente novamente.' };
  } finally {
    clearTimeout(timeout);
  }
}
