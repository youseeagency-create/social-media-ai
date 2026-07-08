"use client";

import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2, Building2, UserPlus, Users, Check } from "lucide-react";
import type { PublicUser, Workspace, WorkspaceClient } from "@/lib/types";

const emptyClientForm = { email: "", password: "", name: "" };

export default function AdminPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<PublicUser[]>([]);
  const [links, setLinks] = useState<WorkspaceClient[]>([]);

  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const [renaming, setRenaming] = useState<Workspace | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [newClientOpen, setNewClientOpen] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [clientError, setClientError] = useState("");

  const [accessWorkspace, setAccessWorkspace] = useState<Workspace | null>(null);

  const loadWorkspaces = () => {
    fetch("/api/workspaces").then((r) => r.json()).then(setWorkspaces);
  };
  const loadClients = () => {
    fetch("/api/users?role=client").then((r) => r.json()).then(setClients);
  };
  const loadLinks = () => {
    fetch("/api/workspace-clients").then((r) => r.json()).then(setLinks);
  };

  useEffect(() => {
    loadWorkspaces();
    loadClients();
    loadLinks();
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
    loadWorkspaces();
  };

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    await fetch("/api/workspaces", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: renaming.id, name: renameValue.trim() }),
    });
    setRenaming(null);
    loadWorkspaces();
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("Delete this workspace? Client access to it will also be removed.")) return;
    await fetch(`/api/workspaces?id=${id}`, { method: "DELETE" });
    loadWorkspaces();
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
      await fetch(`/api/workspace-clients?workspaceId=${workspaceId}&userId=${userId}`, {
        method: "DELETE",
      });
    } else {
      await fetch("/api/workspace-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, userId }),
      });
    }
    loadLinks();
  };

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage client workspaces and account access
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-1.5 border-white/[0.08]">
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
                  <Input
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <Input
                    type="password"
                    value={clientForm.password}
                    onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                    className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
                  />
                </div>
                {clientError && <p className="text-sm text-red-400">{clientError}</p>}
                <Button
                  onClick={handleCreateClient}
                  className="w-full rounded-xl h-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
                >
                  Create Client
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={newWorkspaceOpen} onOpenChange={setNewWorkspaceOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 gap-1.5">
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
                  <Input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="e.g. FABODXB"
                    className="mt-1.5 rounded-xl glass border-white/[0.08] h-11"
                  />
                </div>
                <Button
                  onClick={handleCreateWorkspace}
                  className="w-full rounded-xl h-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
                >
                  Create Workspace
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {workspaces.map((workspace) => {
          const assignedCount = links.filter((l) => l.workspaceId === workspace.id).length;
          return (
            <div
              key={workspace.id}
              className="glass rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20">
                    <Building2 className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <Link href={`/workspace/${workspace.id}/inspiration`} className="text-sm font-semibold hover:underline">
                      {workspace.name}
                    </Link>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-md text-[10px] bg-white/[0.05] border border-white/[0.06]">
                        <Users className="mr-1 h-3 w-3" />
                        {assignedCount} {assignedCount === 1 ? "client" : "clients"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Dialog
                    open={accessWorkspace?.id === workspace.id}
                    onOpenChange={(open) => setAccessWorkspace(open ? workspace : null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Manage access
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm glass-strong rounded-2xl border-white/[0.08]">
                      <DialogHeader>
                        <DialogTitle>Access — {workspace.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-1.5 pt-2">
                        {clients.length === 0 && (
                          <p className="text-sm text-muted-foreground">No client accounts yet.</p>
                        )}
                        {clients.map((client) => {
                          const assigned = links.some(
                            (l) => l.workspaceId === workspace.id && l.userId === client.id
                          );
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
                              {assigned && <Check className="h-4 w-4 text-purple-400" />}
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
                      } else {
                        setRenaming(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm glass-strong rounded-2xl border-white/[0.08]">
                      <DialogHeader>
                        <DialogTitle>Rename Workspace</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="rounded-xl glass border-white/[0.08] h-11"
                        />
                        <Button
                          onClick={handleRename}
                          className="w-full rounded-xl h-11 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
                        >
                          Save
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {workspaces.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">No workspaces yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
