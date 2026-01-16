import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lecturer from "@/models/Lecturer";

export async function POST(req) {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
        );
    }

    // Check if lecturer already exists
    const existingLecturer = await Lecturer.findOne({ email });
    if (existingLecturer) {
        return NextResponse.json(
            { error: "Lecturer already exists with this email" },
            { status: 400 }
        );
    }

    // Create new lecturer (password will be hashed automatically)
    const lecturer = new Lecturer({
        email,
        password
    });

    await lecturer.save();

    return NextResponse.json({
        message: "Lecturer registered successfully",
        lecturer: {
            id: lecturer._id,
            email: lecturer.email,
            createdAt: lecturer.createdAt
        }
    }, { status: 201 });
}
