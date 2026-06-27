import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ status: 200 });
  logger.debug('Cookies', response.cookies.getAll());
  response.cookies.delete('token');
  return response;
}
