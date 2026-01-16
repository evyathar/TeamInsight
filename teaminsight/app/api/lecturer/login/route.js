import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import Lecturer from "@/models/Lecturer";

export async function POST(req) {
  await connectDB();

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  const lecturer = await Lecturer.findOne({ email });

  if (!lecturer) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Compare password using bcrypt
  const isPasswordValid = await lecturer.comparePassword(password);

  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
