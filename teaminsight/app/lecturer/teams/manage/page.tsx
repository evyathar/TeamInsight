"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Member = { memberId: string; displayName: string };

type Team = {
  teamId: string;
  projectName: string;
  status: "green" | "yellow" | "red";
  contactEmail: string;
  members?: Member[];
};

export default function TeamsManagePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [teamId, setTeamId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [memberId, setMemberId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // CSV modal states
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvTeamId, setCsvTeamId] = useState<string | null>(null);
  const [csvStudents, setCsvStudents] = useState<Member[]>([]);
  const [selectedCsv, setSelectedCsv] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);


  const [manualMemberId, setManualMemberId] = useState("");
  const [manualDisplayName, setManualDisplayName] = useState("");


  function loadTeams() {
    setLoading(true);
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) setTeams(data.teams);
      })
      .finally(() => setLoading(false));
  }

  async function addStudentToTeam(teamIdToUpdate: string) {
    setError(null);
    setOkMsg(null);
    setSaving(true);

    try {
      const res = await fetch("/api/lecturer/CsvUpload");
      const data = await res.json();

      if (!data?.ok) {
        setError("Failed to load CSV students");
        return;
      }

      setCsvStudents(data.students);
      setSelectedCsv([]);
      setManualMemberId("");
      setManualDisplayName("");
      setCsvTeamId(teamIdToUpdate); // פותח את ה-Modal
    } finally {
      setSaving(false);
    }
  }

  async function addManualStudent() {
    if (!csvTeamId) return;

    if (!manualMemberId.trim() || !manualDisplayName.trim()) {
      setError("Fill Member ID and Name");
      return;
    }

    await fetch(`/api/teams/${csvTeamId}/add-member`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: manualMemberId.trim(),
        displayName: manualDisplayName.trim(),
        fromCsv: false,
      }),
    });

    setOkMsg("Student added");
    loadTeams();
  }

  async function addSelectedCsvStudents() {
    if (!csvTeamId) return;

    for (const id of selectedCsv) {
      const s = csvStudents.find((x) => x.memberId === id);
      if (!s) continue;

      await fetch(`/api/teams/${csvTeamId}/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: s.memberId,
          displayName: s.displayName,
          fromCsv: true,
        }),
      });
    }

    setOkMsg("CSV students added");
    loadTeams();
    closeCsvModal();
  }

  function closeCsvModal() {
    setCsvTeamId(null);
    setCsvStudents([]);
    setSelectedCsv([]);
  }






  async function removeStudentFromTeam(teamIdToUpdate: string) {
    setError(null);
    setOkMsg(null);
    setSaving(true);

    try {
      const memberId = prompt("Enter Member ID to remove:");
      if (!memberId?.trim()) return;

      const resTeam = await fetch(`/api/teams/${encodeURIComponent(teamIdToUpdate)}`);
      const teamData = await resTeam.json();

      if (!teamData?.ok) {
        setError(teamData?.error || "Failed to load team.");
        return;
      }

      const currentMembers: Member[] = teamData.team.members ?? [];
      const updatedMembers = currentMembers.filter((m) => m.memberId !== memberId.trim());

      if (updatedMembers.length === currentMembers.length) {
        setError("Member ID not found in this team.");
        return;
      }

      const resPut = await fetch(`/api/teams/${encodeURIComponent(teamIdToUpdate)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: updatedMembers }),
      });

      const putData = await resPut.json();
      if (!putData?.ok) {
        setError(putData?.error || "Failed to remove student.");
        return;
      }

      setOkMsg("Student removed successfully.");
      loadTeams();
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam(teamIdToDelete: string) {
    const ok = confirm(`Delete team ${teamIdToDelete}? This cannot be undone.`);
    if (!ok) return;

    setError(null);
    setOkMsg(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(teamIdToDelete)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || "Failed to delete team.");
        return;
      }

      setOkMsg("Team deleted successfully.");
      loadTeams();
    } finally {
      setSaving(false);
    }
  }


  useEffect(() => {
    loadTeams();
  }, []);

  function addMember() {
    setError(null);
    const id = memberId.trim();
    const name = displayName.trim();

    if (!id || !name) {
      setError("Please fill Member ID and Name.");
      return;
    }

    if (members.some((m) => m.memberId === id)) {
      setError("Member ID must be unique within the team.");
      return;
    }

    setMembers((prev) => [...prev, { memberId: id, displayName: name }]);
    setMemberId("");
    setDisplayName("");
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.memberId !== id));
  }

  async function createTeam() {
    setError(null);
    setOkMsg(null);

    const payload = {
      teamId: teamId.trim(),
      projectName: projectName.trim(),
      accessCode: accessCode.trim(),
      contactEmail: contactEmail.trim(),
      members,
      // status optional (DB default or API default)
    };

    if (!payload.teamId || !payload.projectName || !payload.accessCode || !payload.contactEmail) {
      setError("Please fill Team ID, Project Name, Access Code, and Contact Email.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data?.ok) {
        setError(data?.error || "Failed to create team.");
        return;
      }

      setOkMsg("Team created successfully.");
      setTeamId("");
      setProjectName("");
      setAccessCode("");
      setContactEmail("");
      setMembers([]);
      setMemberId("");
      setDisplayName("");

      loadTeams();
    } finally {
      setSaving(false);
    }
  }

  async function openCsvList() {
    setError(null);

    const res = await fetch("/api/lecturer/CsvUpload");
    const data = await res.json();

    if (!data?.ok) {
      setError("Failed to load CSV students");
      return;
    }

    setCsvStudents(data.students);
    setSelectedCsv([]);
    setCsvOpen(true);
  }

  function addSelectedFromCsv() {
    const newOnes = csvStudents.filter(
      (s) =>
        selectedCsv.includes(s.memberId) &&
        !members.some((m) => m.memberId === s.memberId)
    );

    setMembers((prev) => [...prev, ...newOnes]);
    setCsvOpen(false);
  }

  async function uploadCsv() {
    if (!csvFile) {
      setError("Please select a CSV file");
      return;
    }

    setUploading(true);
    setError(null);
    setOkMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await fetch("/api/lecturer/CsvUpload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data?.ok) {
        setError(data?.error || "CSV upload failed");
        return;
      }

      setOkMsg(`CSV uploaded (${data.count} students)`);
      setCsvFile(null);
    } finally {
      setUploading(false);
    }
  }



  return (
    <main className="min-h-screen bg-gray-100 px-4 md:px-8 py-10">
      <div className="w-full max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left */}
          <div>
            <h1 className="text-3xl font-bold">Teams Management</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Create teams and manage their core details.
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Upload CSV */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center
                     w-32 h-10
                     rounded-md bg-green-600 text-white text-sm
                     hover:bg-green-700">
                Choose File
              </span>
            </label>

            <button
              type="button"
              onClick={uploadCsv}
              disabled={uploading}
              className="inline-flex items-center justify-center
               w-32 h-10
               rounded-md bg-red-600 text-white text-sm
               hover:bg-red-700 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload CSV"}
            </button>

            {/* spacing to Back */}
            <div className="ml-4">
              <Link
                href="/lecturer/teams"
                className="text-blue-600 hover:underline text-sm whitespace-nowrap"
              >
                ← Back to Teams
              </Link>
            </div>
          </div>

        </div>


        {/* Create Team Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add Team</h2>

          {(error || okMsg) && (
            <div
              className={`mb-4 rounded-md px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                }`}
            >
              {error ?? okMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Team ID">
              <input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g., 1"
              />
            </Field>

            <Field label="Project Name">
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g., TeamInsight"
              />
            </Field>

            <Field label="Access Code">
              <input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g., ABC123"
              />
            </Field>

            <Field label="Contact Email">
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="team@email.com"
              />
            </Field>
          </div>

          {/* Members builder */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Members</h3>
              <div className="text-sm text-gray-600">Count: {members.length}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Member ID"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addMember}
                className="border rounded-md px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
              >
                + Add Member
              </button>
            </div>

            {members.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 border-b text-sm font-semibold text-gray-700">
                        Member ID
                      </th>
                      <th className="text-left px-4 py-3 border-b text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-right px-4 py-3 border-b text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.memberId} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 border-b text-sm font-medium text-gray-900">{m.memberId}</td>
                        <td className="px-4 py-3 border-b text-sm text-gray-700">{m.displayName}</td>
                        <td className="px-4 py-3 border-b text-right">
                          <button
                            type="button"
                            onClick={() => removeMember(m.memberId)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={createTeam}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create Team"}
            </button>

            <button
              type="button"
              onClick={openCsvList}
              className="px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
            >

              Add From List
            </button>
          </div>
        </div>
        {/* Existing Teams */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Existing Teams</h2>
            <button onClick={loadTeams} className="text-sm text-blue-600 hover:underline">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-gray-600">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">Team ID</th>
                    <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">Project Name</th>
                    <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">Contact Email</th>
                    <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">Members</th>
                    <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-right px-6 py-3 border-b text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.teamId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 border-b text-sm font-medium text-blue-600">
                        <Link href={`/lecturer/teams/${t.teamId}`} className="hover:underline">
                          {t.teamId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 border-b text-sm text-gray-700">{t.projectName}</td>
                      <td className="px-6 py-4 border-b text-sm text-gray-700">{t.contactEmail}</td>
                      <td className="px-6 py-4 border-b text-sm text-gray-700">{t.members?.length ?? 0}</td>
                      <td className="px-6 py-4 border-b">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 border-b text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link
                            href={`/lecturer/teams/${t.teamId}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View →
                          </Link>

                          <button
                            type="button"
                            onClick={() => addStudentToTeam(t.teamId)}
                            disabled={saving}
                            className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-60"
                          >
                            + Student
                          </button>

                          <button
                            type="button"
                            onClick={() => removeStudentFromTeam(t.teamId)}
                            disabled={saving}
                            className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-60"
                          >
                            − Student
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTeam(t.teamId)}
                            disabled={saving}
                            className="text-sm px-3 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>


                    </tr>
                  ))}
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center px-6 py-10 text-gray-500">
                        No teams found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {csvTeamId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded w-[420px] max-h-[75vh] overflow-y-auto">

            <h3 className="font-semibold mb-3">Add Student</h3>

            {/* Manual */}
            <div className="mb-4">
              <input
                placeholder="Member ID"
                value={manualMemberId}
                onChange={(e) => setManualMemberId(e.target.value)}
                className="w-full border px-2 py-1 mb-2"
              />
              <input
                placeholder="Display Name"
                value={manualDisplayName}
                onChange={(e) => setManualDisplayName(e.target.value)}
                className="w-full border px-2 py-1 mb-2"
              />
              <button
                onClick={addManualStudent}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Add Manual Student
              </button>
            </div>

            <hr className="my-3" />

            {/* CSV */}
            {csvStudents.map((s) => (
              <label key={s.memberId} className="block text-sm">
                <input
                  type="checkbox"
                  checked={selectedCsv.includes(s.memberId)}
                  onChange={() =>
                    setSelectedCsv((prev) =>
                      prev.includes(s.memberId)
                        ? prev.filter((x) => x !== s.memberId)
                        : [...prev, s.memberId]
                    )
                  }
                />
                <span className="ml-2">
                  {s.displayName} ({s.memberId})
                </span>
              </label>
            ))}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeCsvModal} className="border px-3 py-1 rounded">
                Cancel
              </button>
              <button
                onClick={addSelectedCsvStudents}
                disabled={selectedCsv.length === 0}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Add Selected
              </button>
            </div>

          </div>
        </div>
      )}

      {csvOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded w-[420px] max-h-[70vh] overflow-y-auto">
            <h3 className="font-semibold mb-3">Add students from list</h3>

            {csvStudents.map((s) => (
              <label key={`${s.memberId}`} className="block text-sm mb-1">
                <input
                  type="checkbox"
                  checked={selectedCsv.includes(s.memberId)}
                  onChange={() =>
                    setSelectedCsv((prev) =>
                      prev.includes(s.memberId)
                        ? prev.filter((x) => x !== s.memberId)
                        : [...prev, s.memberId]
                    )
                  }
                />
                <span className="ml-2">
                  {s.displayName} ({s.memberId})
                </span>
              </label>
            ))}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCsvOpen(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={addSelectedFromCsv}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: "green" | "yellow" | "red" }) {
  const config = {
    green: { dot: "bg-green-500", text: "OK", textColor: "text-green-700", bg: "bg-green-50" },
    yellow: { dot: "bg-yellow-400", text: "Warning", textColor: "text-yellow-700", bg: "bg-yellow-50" },
    red: { dot: "bg-red-500", text: "Risk", textColor: "text-red-700", bg: "bg-red-50" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.textColor}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
}
