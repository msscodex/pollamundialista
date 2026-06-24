// Edge Function: update-user
// Desplegar con: supabase functions deploy update-user
// Solo invocable por usuarios autenticados con is_admin = true
//
// POST { userId, action: 'get' }                        → devuelve { name, email }
// POST { userId, action: 'update', name?, email?, password? } → actualiza campos no-vacíos

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Sin autorización');

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar que el llamante es admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !caller) throw new Error('Token inválido');

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .single();
    if (!callerProfile?.is_admin) throw new Error('No autorizado');

    const body = await req.json();
    const { userId, action, name, email, password } = body;
    if (!userId) throw new Error('userId requerido');

    // ── GET: devolver datos actuales ──────────────────────────────
    if (action === 'get') {
      const [authRes, profileRes] = await Promise.all([
        adminClient.auth.admin.getUserById(userId),
        adminClient.from('profiles').select('name').eq('id', userId).single(),
      ]);
      return new Response(JSON.stringify({
        ok: true,
        email: authRes.data?.user?.email || '',
        name: profileRes.data?.name || '',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── UPDATE ────────────────────────────────────────────────────
    if (name?.trim()) {
      const { error } = await adminClient
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', userId);
      if (error) throw new Error('Error actualizando nombre: ' + error.message);
    }

    const authUpdates: { email?: string; password?: string } = {};
    if (email?.trim()) authUpdates.email = email.trim();
    if (password)        authUpdates.password = password;

    if (Object.keys(authUpdates).length > 0) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, authUpdates);
      if (error) throw new Error('Error actualizando auth: ' + error.message);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
