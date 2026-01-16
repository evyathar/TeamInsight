// Path : teaminsight\app\api\lecturer\CsvUpload\route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CsvStudentList from "@/models/CsvStudentList";
import { parse } from "csv-parse/sync";

/**
 * GET
 * Returns all remaining CSV students for lecturer UI dropdown
 */
export async function GET() {
  try {
    await connectDB();

    const students = await CsvStudentList.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, students }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Uploads CSV file, parses students, and saves them to CsvStudentList
 */
export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "CSV file is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const csvText = buffer
      .toString("utf-8")
      .replace(/^\uFEFF/, "");


    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const students = records.map((row) => {
      if (!row.StudentID || !row.Fname || !row.Lname) {
        throw new Error("Invalid CSV format");
      }

      return {
        memberId: String(row.StudentID),
        displayName: `${row.Fname} ${row.Lname}`
      };
    });

    let insertedCount = 0;

    try {
      const result = await CsvStudentList.insertMany(students, {
        ordered: false 
      });
      insertedCount = result.length;
    } catch (err) {

      if (err.code === 11000 || err.writeErrors) {
        insertedCount = err.result?.nInserted ?? 0;
      } else {
        throw err;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        inserted: insertedCount,
        skipped: students.length - insertedCount
      },
      { status: 201 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 * Removes a single student from CsvStudentList after being added to a team
 */
export async function DELETE(request) {
  try {
    await connectDB();

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    const result = await CsvStudentList.deleteOne({ memberId });

    return NextResponse.json(
      { ok: true, deleted: result.deletedCount === 1 },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
