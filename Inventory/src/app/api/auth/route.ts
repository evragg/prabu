import { NextRequest, NextResponse } from 'next/server';

const USERS = {
  admin: { password: 'admin', role: 'admin' },
  prabu: { password: 'prabu', role: 'viewer' },
};

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const user = USERS[username as keyof typeof USERS];
    
    if (user && user.password === password) {
      const response = NextResponse.json({ success: true, role: user.role });
      
      // Set cookie that expires in 1 day
      response.cookies.set('user_role', user.role, {
        path: '/',
        maxAge: 60 * 60 * 24, 
        httpOnly: false, // allow client side to read for UI changes
        sameSite: 'lax',
      });
      
      return response;
    }

    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE() {
  // Logout
  const response = NextResponse.json({ success: true });
  response.cookies.delete('user_role');
  return response;
}
