import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Recuperação de senha não configurada.' }, { status: 503 });
  }

  try {
    const { email, phone, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').replace(/\D/g, '');

    if (!normalizedEmail || !normalizedPhone || String(password || '').length < 6) {
      return NextResponse.json({ error: 'Dados de recuperação inválidos.' }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, email, phone')
      .ilike('email', normalizedEmail)
      .limit(10);

    if (profileError) throw profileError;
    const profile = (profiles || []).find(
      (item) =>
        String(item.email || '').toLowerCase() === normalizedEmail &&
        String(item.phone || '').replace(/\D/g, '') === normalizedPhone,
    );

    if (!profile) {
      return NextResponse.json({ error: 'E-mail ou telefone incorretos.' }, { status: 400 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, { password });
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (requestError) {
    console.error('Erro ao atualizar senha:', requestError);
    return NextResponse.json(
      { error: requestError instanceof Error ? requestError.message : 'Erro ao atualizar senha.' },
      { status: 500 },
    );
  }
}
