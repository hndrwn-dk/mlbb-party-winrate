"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const queryClient = useQueryClient();

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
      alert("Upload failed");
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

      if (!res.ok) throw new Error("Parse failed");

      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      alert("Match saved successfully!");
      setFile(null);
      setOcrText(null);
      setUploadId(null);
    } catch (error) {
      console.error("Parse error:", error);
      alert("Parse failed");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Upload Match
            </h1>
            <p className="text-muted-foreground">Process your match screenshots</p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-all duration-200 hover:scale-105"
          >
            Back to Dashboard
          </Link>
        </div>

        <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Match Screenshot</CardTitle>
            <CardDescription>
              Upload a screenshot from your MLBB match results screen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file" className="text-base font-semibold">
                Select Image File
              </Label>
              <div className="relative">
                <input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer file:transition-colors cursor-pointer"
                />
              </div>
            </div>

            {file && (
              <div className="p-4 rounded-lg bg-muted/30 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">Selected File</p>
                    <p className="text-sm text-muted-foreground">{file.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full gaming-gradient hover:opacity-90 transition-opacity"
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
              </div>
            )}

            {ocrText && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/20 border border-border">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    OCR Preview
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Review the extracted text before saving
                  </p>
                  <textarea
                    readOnly
                    value={ocrText}
                    className="w-full p-4 border border-border rounded-lg min-h-[200px] bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="OCR text will appear here..."
                  />
                </div>
                <Button
                  onClick={handleParse}
                  disabled={parsing}
                  className="w-full gaming-gradient hover:opacity-90 transition-opacity"
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
              </div>
            )}

            {!file && (
              <div className="p-6 rounded-lg bg-muted/20 border border-dashed border-border text-center">
                <div className="text-4xl mb-3 opacity-50">📸</div>
                <p className="text-sm text-muted-foreground">
                  Select a match screenshot to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}