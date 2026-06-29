"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, Share2, Edit3, FolderOpen, FileText, Image, FileArchive, File, Loader2, X, Check } from "lucide-react";

function getFileIcon(mime: string | null) {
    if (!mime) return File;
    if (mime.startsWith("image")) return Image;
    if (mime.includes("zip") || mime.includes("compressed")) return FileArchive;
    if (mime.includes("pdf") || mime.includes("document") || mime.includes("text")) return FileText;
    return File;
}

function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export default function FilesPage() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [shareFileId, setShareFileId] = useState<string | null>(null);
    const [shareEmail, setShareEmail] = useState("");

    const { data: myFiles = [], isLoading: isLoadingMy } = useQuery({
        queryKey: ["files", "my"],
        queryFn: () => filesService.list().then((r) => r.data),
    });

    const { data: sharedFiles = [], isLoading: isLoadingShared } = useQuery({
        queryKey: ["files", "shared"],
        queryFn: () => filesService.shared().then((r) => r.data),
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => filesService.upload(file),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", "my"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => filesService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", "my"] }),
    });

    const renameMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => filesService.rename(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["files", "my"] });
            setEditingId(null);
        },
    });

    const shareMutation = useMutation({
        mutationFn: ({ id, emails }: { id: string; emails: string[] }) => filesService.share(id, emails),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["files", "my"] });
            setShareFileId(null);
            setShareEmail("");
            toast.success("File shared successfully");
        },
        onError: () => toast.error("Failed to share file")
    });

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadMutation.mutate(file);
    };

    const handleShare = () => {
        if (!shareFileId || !shareEmail.trim()) return;
        const emailsList = shareEmail.split(",").map(e => e.trim()).filter(Boolean);
        if (emailsList.length === 0) return;
        shareMutation.mutate({ id: shareFileId, emails: emailsList });
    };

    const handleDownload = async (id: string, name: string) => {
        try {
            const res = await filesService.download(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
             if (err.response?.status === 403) {
                 toast.error(err.response?.data?.detail || "Download blocked by security policy.");
             } else {
                 toast.error("Failed to download file");
             }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
                    <p className="text-muted-foreground mt-1">Upload, manage, and share your enterprise files securely</p>
                </div>
                <div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                    <Button variant="gradient" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                        {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload File
                    </Button>
                </div>
            </div>

            <Tabs.Root defaultValue="my-files" className="w-full mt-6">
                <Tabs.List className="flex border-b border-border w-full mb-6">
                    <Tabs.Trigger value="my-files" className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                        My Files
                    </Tabs.Trigger>
                    <Tabs.Trigger value="shared" className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all flex items-center gap-2">
                        Shared with Me
                        <Badge variant="secondary" className="px-1.5 py-0 min-w-4 h-4 flex items-center justify-center rounded-full text-[10px]">{sharedFiles.length}</Badge>
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="my-files" className="outline-none">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-medium">
                                <FolderOpen className="w-5 h-5 text-primary" />
                                Your Uploads
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingMy ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : myFiles.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No files uploaded yet</p>
                                    <p className="text-sm">Click Upload to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {myFiles.map((file: any) => {
                                        const Icon = getFileIcon(file.mime_type);
                                        return (
                                            <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors group gap-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="p-2 rounded-lg bg-primary/10">
                                                        <Icon className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {editingId === file.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => renameMutation.mutate({ id: file.id, name: editName })}>
                                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm font-medium truncate">{file.original_name}</p>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                                    {formatSize(file.file_size)} &middot; {new Date(file.created_at).toLocaleDateString()}
                                                                    {file.is_shared && <Badge variant="success" className="h-4 text-[10px] px-1.5 py-0 font-normal ml-1 border-none bg-emerald-500/10 text-emerald-500">Shared</Badge>}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end">
                                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShareFileId(file.id)}>
                                                        <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 ml-1" onClick={() => handleDownload(file.id, file.original_name)}>
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(file.id); setEditName(file.original_name); }}>
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-500/80 hover:bg-red-500/10" onClick={() => deleteMutation.mutate(file.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </Tabs.Content>

                <Tabs.Content value="shared" className="outline-none animate-in fade-in duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-medium">
                                <Share2 className="w-5 h-5 text-primary" />
                                Shared with Me
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingShared ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sharedFiles.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No files have been shared with you</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sharedFiles.map((file: any) => {
                                        const Icon = getFileIcon(file.mime_type);
                                        return (
                                            <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-slate-800/50 transition-colors group gap-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="p-2 rounded-lg bg-primary/10">
                                                        <Icon className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.original_name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Shared by <span className="text-primary/80">{file.owner_id}</span> &middot; {formatSize(file.file_size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end">
                                                    <Button size="sm" variant="gradient" className="h-8" onClick={() => handleDownload(file.id, file.original_name)}>
                                                        <Download className="w-4 h-4 mr-2" /> Download
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </Tabs.Content>
            </Tabs.Root>

            <Dialog.Root open={!!shareFileId} onOpenChange={(open) => !open && setShareFileId(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-card border border-border shadow-lg p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <Dialog.Title className="text-lg font-semibold tracking-tight">Share Document</Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground mt-2 mb-5">
                            Enter the email addresses of the users you want to grant access to. Separate multiple emails with commas.
                        </Dialog.Description>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Addresses</label>
                                <Input 
                                    placeholder="e.g. alice@example.com, bob@example.com" 
                                    value={shareEmail} 
                                    onChange={(e) => setShareEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setShareFileId(null)}>Cancel</Button>
                                <Button onClick={handleShare} disabled={!shareEmail.trim() || shareMutation.isPending}>
                                    {shareMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                                    Share File
                                </Button>
                            </div>
                        </div>
                        <Dialog.Close asChild>
                            <button className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity hover:bg-muted" aria-label="Close">
                                <X className="h-4 w-4" />
                            </button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

        </div>
    );
}
