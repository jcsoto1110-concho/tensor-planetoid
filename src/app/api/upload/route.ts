import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const employeeId = formData.get('employeeId') as string;

    if (!file || !employeeId) {
      return NextResponse.json(
        { error: 'File and employeeId are required' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamic uploads directory path (relative to project root)
    const uploadDir = join(process.cwd(), 'public', 'uploads', employeeId);
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${employeeId}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: filePath 
    });

  } catch (error: any) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
