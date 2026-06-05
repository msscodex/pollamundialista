// Edge Function: create-user
// Desplegar con: supabase functions deploy create-user
// Solo invocable por usuarios autenticados con is_admin = true

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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .single();

    if (!profile?.is_admin) throw new Error('No autorizado');

    // Crear el nuevo usuario
    const { name, email, password } = await req.json();
    if (!name || !email || !password) throw new Error('Faltan campos');

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) throw createErr;

    // Insertar perfil
    const { error: profileErr } = await adminClient
      .from('profiles')
      .insert({ id: created.user.id, name, is_admin: false });
    if (profileErr) throw profileErr;

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
