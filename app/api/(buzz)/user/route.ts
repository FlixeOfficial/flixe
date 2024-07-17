import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]';
import prisma from '@/lib/prisma/prismadb';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { msg: 'You must be logged in.' },
      { status: 401 }
    );
  }
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    if (email) {
      const currentUser = await prisma.user.findUnique({
        where: { email: email },
      });
      if (!currentUser) {
        return NextResponse.json({ msg: 'new user' }, { status: 200 });
      }
      return NextResponse.json(
        { msg: 'user found', user: currentUser },
        { status: 200 }
      );
    }
    return NextResponse.json({ msg: 'no email' }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ msg: 'error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { msg: 'You must be logged in.' },
      { status: 401 }
    );
  }
  try {
    const data = await req.json();
    const email = data.email;
    if (email) {
      const currentUser = await prisma.user.findUnique({
        where: { email: email },
      });
      if (!currentUser) {
        // create
        const user = await prisma.user.create({
          data: data,
        });
        return NextResponse.json({ msg: 'done', user }, { status: 200 });
      } else {
        // update
        const user = await prisma.user.update({
          where: { email: email },
          data: data,
        });
        return NextResponse.json({ msg: 'done', user }, { status: 200 });
      }
    }
    return NextResponse.json({ msg: 'no email' }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ msg: 'error' }, { status: 500 });
  }
}