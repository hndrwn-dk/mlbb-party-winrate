"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ocrFromImage } from "@/lib/ocr-client";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
        setOcrText(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOcrText(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setUploadId(data.uploadId);

      const text = await ocrFromImage(file);
      setOcrText(text);
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleParse = async () => {
    if (!ocrText || !uploadId) return;

    setParsing(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: ocrText, uploadId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Parse failed" }));
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Parse failed";
        throw new Error(errorMessage);
      }

      const data = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      showToast("Match saved successfully!", "success");
      setFile(null);
      setOcrText(null);
      setUploadId(null);
    } catch (error) {
      console.error("Parse error:", error);
      const errorMessage = error instanceof Error ? error.message : "Parse failed";
      showToast(errorMessage, "error");
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setOcrText(null);
    setUploadId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toUpperCase() || "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Upload Files</h1>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Upload Match Screenshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">i</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Which screenshot should I upload?
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload the <strong className="text-foreground">Summary</strong> screen from the post-match results.
                    This screen shows KDA (Kills/Deaths/Assists), player names, heroes, and match result (VICTORY/DEFEAT).
                  </p>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-green-700 font-bold">+</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Recommended: Summary Screen</p>
                    <p className="text-xs text-muted-foreground">
                      Contains KDA format (6/4/4), player names, heroes, gold, and clear VICTORY/DEFEAT text.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-yellow-700 font-bold">~</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Alternative: Overall Screen</p>
                    <p className="text-xs text-muted-foreground">
                      May work if it contains KDA and match result, but Summary is preferred for best accuracy.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-gray-600 font-bold">-</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Not needed: DPS, Team, Farm screens</p>
                    <p className="text-xs text-muted-foreground">
                      These screens don&apos;t contain the required KDA format and player information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${dragActive 
                  ? "border-primary bg-muted" 
                  : "border-border bg-background hover:border-primary/50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center">
                  <span className="text-3xl font-light text-foreground/60">+</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drag & drop or click to upload Summary screenshot
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <span>ⓘ</span>
                    <span>Max file size: 10 MB</span>
                  </div>
                </div>
              </div>
            </div>

            {file && (
              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-chart-1 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {getFileExtension(file.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getFileExtension(file.name).toLowerCase()} | {formatFileSize(file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 p-0"
                      variant="ghost"
                    >
                      <span className="text-sm">↓</span>
                    </Button>
                    <Button
                      onClick={handleRemoveFile}
                      className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 p-0"
                      variant="ghost"
                      title="Remove file"
                    >
                      <span className="text-sm font-bold">X</span>
                    </Button>
                  </div>
                </div>

                {!ocrText && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Processing OCR...
                      </span>
                    ) : (
                      "Process Image"
                    )}
                  </Button>
                )}
              </div>
            )}

            {ocrText && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <Label className="text-sm font-semibold mb-2 block">
                    OCR Preview
                  </Label>
                  <textarea
                    readOnly
                    value={ocrText}
                    className="w-full p-3 border border-border rounded-lg min-h-[150px] bg-background text-foreground font-mono text-xs resize-none focus:outline-none"
                    placeholder="OCR text will appear here..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleParse}
                    disabled={parsing}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {parsing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Saving Match...
                      </span>
                    ) : (
                      "Save Match"
                    )}
                  </Button>
                  <Button
                    onClick={handleRemoveFile}
                    variant="outline"
                    className="px-4"
                  >
                    Remove file
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
