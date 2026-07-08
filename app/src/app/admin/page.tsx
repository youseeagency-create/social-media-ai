"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  UserPlus,
  Users,
  Check,
  Search,
  Film,
  Play,
  Settings2,
  Activity,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { formatBytes } from "@/lib/footage";
import { ActivityList } from "@/components/activity-list";
import type { PublicUser, Workspace, WorkspaceClient } from "@/lib/types";
import type { AdminOverview, ActivityEntry } from "@/lib/db";

const emptyClientForm = { email: "", password: "", name: "" };

function formatDate(iso: string | null): string {
  if (!iso) return "No activity yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No activity yet";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const QUICK_LINKS = [
  { href: "/videos", label: "Videos", desc: "Viral analysis tool", icon: Film, primary: true },
  { href: "/run", label: "Run Pipeline", desc: "Scrape & analyze", icon: Play, primary: false },
  { href: "/creators", label: "Creators", desc: "Competitor accounts", icon: Users, primary: false },
  { href: "/configs", label: "Configs", desc: "Prompts & categories", icon: Settings2, primary: false },
];

type WorkspaceOverview = AdminOverview["workspaces"][number];

export default function AdminPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<PublicUser[]>([]);
  const [links, setLinks] = useState<WorkspaceClient[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [unseen, setUnseen] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [renaming, setRenaming] = useState<Workspace | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [clientError, setClientError] = useState("");
  const [accessWorkspace, setAccessWorkspace] = useState<Workspace | null>(null);

  const loadWorkspaces = () => fetch("/api/workspaces").then((r) => r.json()).then(setWorkspaces);
  const loadClients = () => fetch("/api/users?role=client").then((r) => r.json()).then(setClients);
  const loadLinks = () => fetch("/api/workspace-clients").then((r) => r.json()).then(setLinks);
  const loadOverview = () => fetch("/api/admin/overview").then((r) => r.json()).then(setOverview).catch(() => {});
  const loadActivity = () =>
    fetch("/api/activity?limit=30").then((r) => r.json()).then((d) => setActivity(Array.isArray(d) ? d : [])).catch(() => {});
  const loadUnseen = () =>
    fetch("/api/notifications").then((r) => r.json()).then((d) => setUnseen(d && typeof d === "object" ? d : {})).catch(() => {});

  const reloadAll = () => {
    loadWorkspaces();
    loadOverview();
    loadActivity();
    loadUnseen();
  };

  useEffect(() => {
    loadWorkspaces();
    loadClients();
    loadLinks();
    loadOverview();
    loadActivity();
    loadUnseen();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWorkspaceName.trim() }),
    });
    setNewWorkspaceName("");
    setNewWorkspaceOpen(false);
    reloadAll();
  };

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    await fetch("/api/workspaces", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: renaming.id, name: renameValue.trim() }),
    });
    setRenaming(null);
    reloadAll();
  };

  const handleArchive = async (id: string, archived: boolean) => {
    await fetch("/api/workspaces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived }),
    });
    reloadAll();
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("Delete this workspace permanently? All its data will be removed. (Consider archiving instead.)")) return;
    await fetch(`/api/workspaces?id=${id}`, { method: "DELETE" });
    reloadAll();
  };

  const handleCreateClient = async () => {
    setClientError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...clientForm, role: "client" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setClientError(data.error || "Failed to create client");
      return;
    }
    setClientForm(emptyClientForm);
    setNewClientOpen(false);
    loadClients();
  };

  const toggleAccess = async (workspaceId: string, userId: string) => {
    const existing = links.find((l) => l.workspaceId === workspaceId && l.userId === userId);
    if (existing) {
      await fetch(`/api/workspace-clients?workspaceId=${workspaceId}&userId=${userId}`, { method: "DELETE" });
    } else {
      await fetch("/api/workspace-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, userId }),
      });
    }
    loadLinks();
  };

  const ovById = useMemo(() => {
    const map: Record<string, WorkspaceOverview> = {};
    overview?.workspaces.forEach((w) => (map[w.id] = w));
    return map;
  }, [overview]);

  const activeThisWeek = useMemo(() => {
    if (!overview) return 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return overview.workspaces.filter(
      (w) => !w.archivedAt && w.lastActivityAt && new Date(w.lastActivityAt).getTime() >= weekAgo
    ).length;
  }, [overview]);

  const activeWorkspaces = workspaces.filter((w) => !w.archivedAt);
  const archivedWorkspaces = workspaces.filter((w) => w.archivedAt);
  const filtered = activeWorkspaces.filter((w) => w.name.toLowerCase().includes(search.trim().toLowerCase()));

  const stats = [
    { label: "Workspaces", value: overview?.stats.workspaceCount ?? activeWorkspaces.length },
    { label: "Clients", value: overview?.stats.clientCount ?? clients.length },
    { label: "Storage used", value: formatBytes(overview?.stats.storageBytes ?? 0) },
    { label: "Active this week", value: activeThisWeek },
  ];

  const renderCard = (workspace: Workspace, archived: boolean) => {
    const ov = ovById[workspace.id];
    const assignedCount = links.filter((l) => l.workspaceId === workspace.id).length;
    return (
      <div key={workspace.id} className="rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-900">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200">
              <Building2 className="h-4 w-4 text-neutral-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/workspace/${workspace.id}/home`} className="text-sm font-semibold hover:underline">
                  {workspace.name}
                </Link>
                {!archived && unseen[workspace.id] && (
                  <span className="h-2 w-2 rounded-full bg-neutral-900" title="New activity since you last checked" />
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge variant="secondary" className="rounded-md text-[10px] bg-neutral-100 border border-neutral-200 text-neutral-700">
                  <Users className="mr-1 h-3 w-3" />
                  {assignedCount} {assignedCount === 1 ? "client" : "clients"}
                </Badge>
                <span className="text-[11px] text-neutral-500">Last activity: {formatDate(ov?.lastActivityAt ?? null)}</span>
                <span className="text-[11px] text-neutral-500">Storage: {formatBytes(ov?.storageBytes ?? 0)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            {archived ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleArchive(workspace.id, false)} className="h-8 rounded-lg px-2.5 text-xs text-neutral-600 hover:text-foreground gap-1">
                  <ArchiveRestore className="h-3.5 w-3.5" /> Unarchive
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteWorkspace(workspace.id)} className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Dialog open={accessWorkspace?.id === workspace.id} onOpenChange={(open) => setAccessWorkspace(open ? workspace : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground">
                      Manage access
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm glass-strong rounded-2xl border-white/[0.08]">
                    <DialogHeader>
                      <DialogTitle>Access — {workspace.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5 pt-2">
                      {clients.length === 0 && <p className="text-sm text-muted-foreground">No client accounts yet.</p>}
                      {clients.map((client) => {
                        const assigned = links.some((l) => l.workspaceId === workspace.id && l.userId === client.id);
                        return (
                          <button
                            key={client.id}
                            onClick={() => toggleAccess(workspace.id, client.id)}
                            className="flex w-full items-center justify-between rounded-xl glass border-white/[0.08] px-3 py-2.5 text-left hover:bg-white/[0.05]"
                          >
                            <div>
                              <p className="text-sm">{client.name}</p>
                              <p className="text-xs text-muted-foreground">{client.email}</p>
                            </div>
                            {assigned && <Check className="h-4 w-4 text-neutral-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={renaming?.id === workspace.id}
                  onOpenChange={(open) => {
                    if (open) {
                      setRenaming(workspace);
                      setRenameValue(workspace.name);
                    } else setRenaming(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm glass-strong rounded-2xl border-white/[0.08]">
                    <DialogHeader>
                      <DialogTitle>Rename Workspace</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="rounded-xl glass border-white/[0.08] h-11" />
                      <Button onClick={handleRename} className="w-full rounded-xl h-11 bg-neutral-900 text-white hover:bg-neutral-800 border-0">
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="sm" onClick={() => handleArchive(workspace.id, true)} title="Archive (deactivate)" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground">
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteWorkspace(workspace.id)} className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Header + primary actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of every client workspace and quick access to your tools</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-1.5 border-neutral-300">
                <UserPlus className="h-4 w-4" />
                New Client Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass-strong rounded-2xl border-white/[0.08]">
              <DialogHeader>
                <DialogTitle>New Client Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} className="mt-1.5 rounded-xl glass border-white/[0.08] h-11" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} className="mt-1.5 rounded-xl glass border-white/[0.08] h-11" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <Input type="password" value={clientForm.password} onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })} className="mt-1.5 rounded-xl glass border-white/[0.08] h-11" />
                </div>
                {clientError && <p className="text-sm text-red-500">{clientError}</p>}
                <Button onClick={handleCreateClient} className="w-full rounded-xl h-11 bg-neutral-900 text-white hover:bg-neutral-800 border-0">
                  Create Client
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={newWorkspaceOpen} onOpenChange={setNewWorkspaceOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 border-0 gap-1.5">
                <Plus className="h-4 w-4" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass-strong rounded-2xl border-white/[0.08]">
              <DialogHeader>
                <DialogTitle>New Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Workspace Name</Label>
                  <Input value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="e.g. FABODXB" className="mt-1.5 rounded-xl glass border-white/[0.08] h-11" />
                </div>
                <Button onClick={handleCreateWorkspace} className="w-full rounded-xl h-11 bg-neutral-900 text-white hover:bg-neutral-800 border-0">
                  Create Workspace
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-500">Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${
                link.primary ? "border-neutral-900 bg-neutral-900 text-white hover:bg-black" : "border-neutral-200 bg-white hover:border-neutral-900"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${link.primary ? "bg-white/10" : "bg-neutral-100"}`}>
                <link.icon className={`h-4 w-4 ${link.primary ? "text-white" : "text-neutral-700"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{link.label}</p>
                <p className={`text-xs ${link.primary ? "text-neutral-300" : "text-neutral-500"}`}>{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Workspaces + activity */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-neutral-500">Workspaces</h2>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workspaces…" className="h-10 rounded-xl border-neutral-300 bg-white pl-9" />
            </div>
          </div>

          <div className="grid gap-4">
            {filtered.map((w) => renderCard(w, false))}

            {activeWorkspaces.length === 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-neutral-300" />
                <h3 className="mt-4 font-semibold">No workspaces yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create one to get started.</p>
              </div>
            )}
            {activeWorkspaces.length > 0 && filtered.length === 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-muted-foreground">
                No workspaces match “{search}”.
              </div>
            )}
          </div>

          {archivedWorkspaces.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
              >
                <Archive className="h-4 w-4" />
                Archived ({archivedWorkspaces.length})
                <span className="text-neutral-400">{showArchived ? "▲" : "▼"}</span>
              </button>
              {showArchived && <div className="mt-4 grid gap-4">{archivedWorkspaces.map((w) => renderCard(w, true))}</div>}
            </div>
          )}
        </div>

        {/* Activity log */}
        <div>
          <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-neutral-500">
            <Activity className="h-4 w-4" /> Activity log
          </h2>
          <div className="rounded-2xl border border-neutral-200 bg-white p-2">
            <ActivityList entries={activity} showWorkspace empty="No activity across your workspaces yet." />
          </div>
        </div>
      </div>
    </div>
  );
}
