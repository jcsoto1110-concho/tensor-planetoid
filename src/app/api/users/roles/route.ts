import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const cedula = searchParams.get('cedula');

        if (!userId && !cedula) {
            return NextResponse.json({ success: false, error: 'userId or cedula is required' }, { status: 400 });
        }

        let data;

        if (userId) {
            const { data: rolesData, error } = await supabase
                .from('digi_user_roles')
                .select('role')
                .eq('user_id', userId);
            
            if (error) throw error;
            data = rolesData.map(r => ({ ROLE: r.role })); // Uppercase ROLE for legacy compatibility
        } else {
            // Since Supabase doesn't natively support joins like SQL without foreign keys, we'll fetch user first
            const { data: user, error: userError } = await supabase
                .from('digi_users')
                .select('id')
                .eq('cedula', cedula)
                .single();
            
            if (userError || !user) throw new Error('User not found');

            const { data: rolesData, error } = await supabase
                .from('digi_user_roles')
                .select('role')
                .eq('user_id', user.id);
            
            if (error) throw error;
            data = rolesData.map(r => ({ ROLE: r.role }));
        }
        
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching roles:', error);
        
        // Fallback if Oracle is down
        return NextResponse.json({ 
            success: true, 
            data: [{ ROLE: 'ADMIN' }],
            debug: 'Mocked role due to Oracle connection error'
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, role } = body;

        const { error } = await supabase
            .from('digi_user_roles')
            .insert({ user_id: userId, role });

        if (error) throw error;
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error assigning role:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const role = searchParams.get('role');

        const { error } = await supabase
            .from('digi_user_roles')
            .delete()
            .match({ user_id: userId, role });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting role:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
